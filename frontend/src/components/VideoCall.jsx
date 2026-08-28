import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

/* =====================================================
   VIDEO / AUDIO CONSULTATION CALL
   -----------------------------------------------------
   Real-time WebRTC call for a single eligible booking.

   - video mode: both camera streams displayed
   - audio mode: audio-only (no camera requested)
   - signaling via JWT-authenticated Socket.IO
   - server-side eligibility verified via REST before
     the socket room is joined (ownership, payment,
     booking status, reader assignment)
   - duration enforced with server-controlled start time
===================================================== */

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // NOTE: No TURN servers configured. On restrictive networks
    // (symmetric NAT/firewalls) peer-to-peer may fail. Add TURN
    // credentials via an env-driven config for production.
];

export default function VideoCall({ bookingId, token, onEnded }) {
    const videoRef = useRef(null); // remote video
    const selfVideoRef = useRef(null); // local (self) video
    const audioRef = useRef(null); // remote audio element

    const [connecting, setConnecting] = useState(true);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [error, setError] = useState("");

    const [callType, setCallType] = useState("video"); // 'video' | 'audio'
    const [cameraOn, setCameraOn] = useState(true);
    const [micMuted, setMicMuted] = useState(false);
    const [speakerOn, setSpeakerOn] = useState(true);

    const [peerName, setPeerName] = useState("");
    const [consultationType, setConsultationType] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [timeRemaining, setTimeRemaining] = useState(30 * 60);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);
    const heartbeatRef = useRef(null);
    const timerRef = useRef(null);

    /* ---------------- LOCAL STREAM SETUP ---------------- */
    const startLocalStream = useCallback(async (type) => {
        const wantVideo = type === "video";
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: wantVideo,
                audio: true,
            });
            localStreamRef.current = stream;

            if (selfVideoRef.current) {
                selfVideoRef.current.srcObject = stream;
            }

            return stream;
        } catch (err) {
            let message = "Unable to access camera/microphone.";
            if (err?.name === "NotAllowedError") {
                message = wantVideo
                    ? "Camera permission is required for video consultation."
                    : "Microphone permission is required for audio consultation.";
            } else if (err?.name === "NotFoundError") {
                message = wantVideo
                    ? "No camera found. Please connect a camera or use audio-only."
                    : "No microphone found. Please connect a microphone.";
            } else if (err?.name === "NotReadableError") {
                message = "Camera or microphone is already in use by another application.";
            }
            setError(message);
            setConnecting(false);
            throw err;
        }
    }, []);

    /* ---------------- PEER CONNECTION ---------------- */
    const createPeerConnection = useCallback((localStream) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (event.track.kind === "video" && videoRef.current) {
                videoRef.current.srcObject = stream;
            } else if (event.track.kind === "audio" && audioRef.current) {
                audioRef.current.srcObject = stream;
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === "connected") {
                setConnected(true);
                setConnecting(false);
                setReconnecting(false);
            } else if (state === "connecting" || state === "checking") {
                setConnecting(true);
            } else if (state === "disconnected" || state === "failed") {
                setConnected(false);
                setReconnecting(true);
            } else if (state === "closed") {
                setConnected(false);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit("ice_candidate", { candidate: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "disconnected") {
                setReconnecting(true);
            } else if (pc.iceConnectionState === "connected") {
                setReconnecting(false);
            }
        };

        return pc;
    }, []);

    /* ---------------- JOIN FLOW ---------------- */
    const setupCall = useCallback(async () => {
        setConnecting(true);
        setError("");

        // 1. Verify eligibility + get context on the backend (never trust the client)
        let joinData;
        try {
            const joinRes = await fetch(`${API_BASE}/consultations/${bookingId}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const joinJson = await joinRes.json();

            if (!joinRes.ok) {
                throw new Error(joinJson.message || "You are not eligible to join this consultation.");
            }
            joinData = joinJson;
        } catch (err) {
            setError(err.message || "Failed to join consultation.");
            setConnecting(false);
            return;
        }

        // 2. Determine call type BEFORE requesting media
        const type = joinData.booking?.call_type || "video";
        setCallType(type);

        let stream;
        try {
            stream = await startLocalStream(type);
        } catch {
            return; // error already set
        }

        // 3. Socket.IO with JWT
        const socket = io(SOCKET_URL, { auth: { token } });
        socketRef.current = socket;

        // 4. Peer connection
        const pc = createPeerConnection(stream);
        pcRef.current = pc;

        // 5. Room join (server-verified)
        socket.emit("join_consultation", { booking_id: bookingId }, (ack) => {
            if (ack?.error) {
                setError(ack.error);
                setConnecting(false);
                return;
            }
            if (ack?.ok) {
                setPeerName(ack.astrologer_name || ack.customer_name || "Peer");
                setConsultationType(ack.consultation_type || "");
                setDurationMinutes(Number(ack.duration_minutes || 30));
                setTimeRemaining(Number(ack.duration_minutes || 30) * 60);
                setConnecting(false);
            }
        });

        // ---------- SOCKET EVENT HANDLERS ----------
        socket.on("participant_joined", (data) => {
            setPeerName(data.name || "Peer");
            // The peer already in the room creates the offer (avoids glare:
            // only the pre-existing participant receives this event).
            if (pc.connectionState === "new" || pc.connectionState === "connecting") {
                pc.createOffer()
                    .then((offer) => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit("offer", { sdp: pc.localDescription });
                    })
                    .catch((e) => console.error("Offer error:", e));
            }
        });

        socket.on("offer", async (data) => {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", { sdp: pc.localDescription });
            } catch (e) {
                console.error("Answer error:", e);
            }
        });

        socket.on("answer", async (data) => {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } catch (e) {
                console.error("Remote description error:", e);
            }
        });

        socket.on("ice_candidate", async (data) => {
            try {
                if (data.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            } catch (e) {
                console.error("ICE error:", e);
            }
        });

        socket.on("participant_left", () => {
            setReconnecting(true);
        });

        socket.on("call_ended", () => {
            setConnected(false);
            cleanup();
            onEnded && onEnded();
        });

        socket.on("consultation_started", () => {
            setConnecting(false);
        });

        socket.on("disconnect", () => {
            setReconnecting(true);
            setConnected(false);
        });

        socket.io.on("reconnect", () => {
            setReconnecting(false);
            socket.emit("join_consultation", { booking_id: bookingId });
        });

        socket.io.on("reconnect_attempt", () => {
            setReconnecting(true);
        });

        socket.on("connect_error", () => {
            setError("Connection lost. Reconnecting...");
            setReconnecting(true);
        });

        // ---------- HEARTBEAT (every 20s) ----------
        heartbeatRef.current = setInterval(() => {
            socket.emit("heartbeat", {});
        }, 20000);
    }, [bookingId, token, startLocalStream, createPeerConnection, onEnded]);

    /* ---------------- TIMER (starts when connected) ---------------- */
    useEffect(() => {
        if (!connected || timeRemaining <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setError("Consultation time is up. Ending the call...");
                    endCall("time up");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    /* ---------------- MEDIA CONTROLS ---------------- */
    const toggleCamera = () => {
        if (!localStreamRef.current || callType !== "video") return;
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((t) => {
            t.enabled = !cameraOn;
        });
        setCameraOn(!cameraOn);
        socketRef.current?.emit("toggle_camera", { enabled: !cameraOn });
    };

    const toggleMic = () => {
        if (!localStreamRef.current) return;
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((t) => {
            t.enabled = micMuted; // current muted -> enable
        });
        setMicMuted(!micMuted);
        socketRef.current?.emit("toggle_mic", { muted: !micMuted });
    };

    const toggleSpeaker = () => {
        setSpeakerOn((prev) => {
            const next = !prev;
            if (audioRef.current) audioRef.current.muted = !next;
            if (videoRef.current) videoRef.current.muted = !next;
            return next;
        });
    };

    /* ---------------- END CALL ---------------- */
    const endCall = useCallback(async (reason = "call ended") => {
        socketRef.current?.emit("call_ended", { booking_id: bookingId, reason });

        try {
            await fetch(`${API_BASE}/consultations/${bookingId}/end`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (e) {
            // Best effort — the server marks completion on the next heartbeat
        }

        cleanup();
        onEnded && onEnded();
    }, [bookingId, token, onEnded]);

    /* ---------------- CLEANUP ---------------- */
    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    /* ---------------- MOUNT / UNMOUNT ---------------- */
    useEffect(() => {
        setupCall();

        return () => cleanup();
    }, [setupCall, cleanup]);

    /* ---------------- FORMAT TIME ---------------- */
    const formatTime = (totalSeconds) => {
        const s = Math.max(0, Math.floor(totalSeconds));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    /* ---------------- RENDER ---------------- */
    return (
        <div style={styles.container}>
            {/* Hidden audio element for remote audio */}
            <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />

            {/* Loading / connecting / reconnecting state */}
            {(connecting || reconnecting) && !error && (
                <div style={styles.overlay}>
                    <div style={styles.spinner} />
                    <h2 style={styles.overlayTitle}>
                        {reconnecting ? "Reconnecting..." : "Connecting to consultation..."}
                    </h2>
                    <p style={styles.overlaySub}>
                        {reconnecting
                            ? "Connection lost. Reconnecting..."
                            : "Please wait while we secure your consultation."}
                    </p>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div style={styles.errorOverlay}>
                    <div style={styles.errorBox}>
                        <div style={styles.errorIcon}>⚠️</div>
                        <h3 style={styles.errorTitle}>Consultation unavailable</h3>
                        <p style={styles.errorText}>{error}</p>
                        <button onClick={() => onEnded && onEnded()} style={styles.leaveBtn}>
                            ← Back to Bookings
                        </button>
                    </div>
                </div>
            )}

            {/* Call header */}
            {!error && (
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <div style={styles.headerIcon}>{callType === "video" ? "🎥" : "🎙️"}</div>
                        <div>
                            <p style={styles.headerEyebrow}>
                                {callType === "video" ? "VIDEO CONSULTATION" : "AUDIO CONSULTATION"}
                            </p>
                            <h1 style={styles.headerTitle}>
                                {peerName || "Shwetha Cosmic"}
                            </h1>
                        </div>
                    </div>

                    <div style={styles.headerRight}>
                        <div style={styles.timerBox}>
                            <span style={styles.timerLabel}>Time Remaining</span>
                            <strong style={styles.timerValue}>{formatTime(timeRemaining)}</strong>
                        </div>
                        {consultationType && (
                            <span style={styles.typeBadge}>{consultationType}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Video area */}
            {!error && (
                <div style={styles.videoArea}>
                    {callType === "video" ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline style={styles.remoteVideo} />
                            <video
                                ref={selfVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={styles.selfVideo}
                            />
                        </>
                    ) : (
                        <div style={styles.audioOnly}>
                            <div style={styles.audioWave}>🎙️</div>
                            <h2 style={styles.audioTitle}>{peerName || "Shwetha Cosmic"}</h2>
                            <p style={styles.audioSub}>Audio consultation in progress...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            {!error && (
                <div style={styles.controls}>
                    {callType === "video" && (
                        <ControlButton
                            active={cameraOn}
                            icon={cameraOn ? "📷" : "🚫"}
                            label={cameraOn ? "Camera On" : "Camera Off"}
                            onClick={toggleCamera}
                            danger={!cameraOn}
                        />
                    )}

                    <ControlButton
                        active={!micMuted}
                        icon={micMuted ? "🔇" : "🎤"}
                        label={micMuted ? "Muted" : "Mic On"}
                        onClick={toggleMic}
                        danger={micMuted}
                    />

                    <ControlButton
                        active={speakerOn}
                        icon={speakerOn ? "🔊" : "🔈"}
                        label={speakerOn ? "Speaker On" : "Speaker Off"}
                        onClick={toggleSpeaker}
                    />

                    <ControlButton
                        active={false}
                        icon="📞"
                        label="End Call"
                        onClick={() => endCall()}
                        endCall
                    />
                </div>
            )}

            {/* Connection status footer */}
            {!error && (
                <div style={styles.footer}>
                    {connected ? (
                        <span style={styles.statusOk}>● Connected</span>
                    ) : reconnecting ? (
                        <span style={styles.statusWarn}>◌ Reconnecting...</span>
                    ) : (
                        <span style={styles.statusWait}>◌ Connecting...</span>
                    )}
                    <span style={styles.bookingId}>Booking #{bookingId}</span>
                </div>
            )}
        </div>
    );
}

/* =====================================================
   CONTROL BUTTON
===================================================== */
function ControlButton({ icon, label, onClick, active, danger = false, endCall = false }) {
    return (
        <button
            onClick={onClick}
            style={{
                ...styles.controlBtn,
                ...(active && !danger && !endCall ? styles.controlActive : {}),
                ...(danger && !endCall ? styles.controlDanger : {}),
                ...(endCall ? styles.endCallBtn : {}),
            }}
        >
            <span style={styles.controlIcon}>{icon}</span>
            <span style={styles.controlLabel}>{label}</span>
        </button>
    );
}

/* =====================================================
   STYLES (Shwetha Cosmic cosmic theme)
===================================================== */
const styles = {
    container: {
        minHeight: "100vh",
        background: "radial-gradient(circle at 30% 20%, #1a0f2e 0%, #0b0614 60%, #05030a 100%)",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 5%",
        gap: "15px",
        flexWrap: "wrap",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(5,3,10,0.6)",
        backdropFilter: "blur(12px)",
    },

    headerLeft: { display: "flex", alignItems: "center", gap: "14px" },

    headerIcon: {
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(217,173,99,0.12)",
        border: "1px solid rgba(217,173,99,0.3)",
        fontSize: "22px",
    },

    headerEyebrow: { color: "#d9ad63", fontSize: "10px", letterSpacing: "2px", margin: "0 0 4px" },

    headerTitle: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "22px",
        fontWeight: "500",
        margin: 0,
    },

    headerRight: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },

    timerBox: {
        textAlign: "center",
        padding: "8px 16px",
        borderRadius: "12px",
        background: "rgba(217,173,99,0.08)",
        border: "1px solid rgba(217,173,99,0.25)",
    },

    timerLabel: { display: "block", color: "#91889c", fontSize: "9px", letterSpacing: "1px" },

    timerValue: {
        color: "#d9ad63",
        fontSize: "20px",
        fontWeight: "700",
        fontVariantNumeric: "tabular-nums",
    },

    typeBadge: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "rgba(139,92,246,0.12)",
        border: "1px solid rgba(139,92,246,0.3)",
        color: "#b79cff",
        fontSize: "12px",
    },

    videoArea: {
        flex: 1,
        position: "relative",
        minHeight: "52vh",
        background: "#05030a",
        margin: "20px 3% 0",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
    },

    remoteVideo: {
        width: "100%",
        height: "100%",
        minHeight: "52vh",
        objectFit: "cover",
        position: "absolute",
        inset: 0,
    },

    selfVideo: {
        position: "absolute",
        bottom: "16px",
        right: "16px",
        width: "180px",
        maxWidth: "32%",
        aspectRatio: "3/4",
        borderRadius: "14px",
        objectFit: "cover",
        border: "2px solid rgba(217,173,99,0.4)",
        background: "#120b1d",
        zIndex: 5,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    },

    audioOnly: {
        width: "100%",
        height: "100%",
        minHeight: "52vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    },

    audioWave: { fontSize: "70px", marginBottom: "8px" },

    audioTitle: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: "500", margin: 0 },

    audioSub: { color: "#91889c", fontSize: "13px" },

    controls: {
        display: "flex",
        justifyContent: "center",
        gap: "14px",
        padding: "22px 5%",
        flexWrap: "wrap",
    },

    controlBtn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
        padding: "13px 18px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(20,12,32,0.8)",
        color: "#b8afc0",
        cursor: "pointer",
        minWidth: "84px",
        transition: "transform 0.15s ease, background 0.15s ease",
    },

    controlActive: {
        background: "rgba(101,230,165,0.12)",
        borderColor: "rgba(101,230,165,0.4)",
        color: "#65e6a5",
    },

    controlDanger: {
        background: "rgba(255,80,80,0.08)",
        borderColor: "rgba(255,80,80,0.4)",
        color: "#ff8585",
    },

    endCallBtn: {
        background: "linear-gradient(135deg, #ff5d5d, #c22f2f)",
        border: "none",
        color: "#fff",
        fontWeight: "700",
    },

    controlIcon: { fontSize: "22px" },
    controlLabel: { fontSize: "11px", fontWeight: "600" },

    footer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 5%",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        color: "#91889c",
        fontSize: "12px",
    },

    statusOk: { color: "#65e6a5" },
    statusWarn: { color: "#d9ad63" },
    statusWait: { color: "#91889c" },

    bookingId: { color: "#777080" },

    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(5,3,10,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        gap: "12px",
        textAlign: "center",
        padding: "20px",
    },

    spinner: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        border: "3px solid rgba(217,173,99,0.2)",
        borderTopColor: "#d9ad63",
        animation: "spin 0.9s linear infinite",
    },

    overlayTitle: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: "500",
        color: "#d9ad63",
        margin: 0,
    },

    overlaySub: { color: "#91889c", margin: 0 },

    errorOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(5,3,10,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "20px",
    },

    errorBox: {
        maxWidth: "440px",
        textAlign: "center",
        padding: "40px 30px",
        background: "#120b1d",
        border: "1px solid rgba(255,80,80,0.3)",
        borderRadius: "20px",
    },

    errorIcon: { fontSize: "50px", marginBottom: "14px" },
    errorTitle: { color: "#ff8585", margin: "0 0 10px" },
    errorText: { color: "#91889c", fontSize: "14px", lineHeight: "1.6", margin: "0 0 22px" },

    leaveBtn: {
        padding: "12px 22px",
        borderRadius: "9px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
    },
};
