"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall, DailyEventObjectParticipant } from "@daily-co/daily-js";

interface VideoParticipant {
  userId: string;
  userName: string;
  sessionTime: number; // seconds
  totalTime: number; // seconds
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface MultiStudentVideoGridProps {
  sessionId: string;
  videoToken: string;
  roomUrl: string;
  isTutor: boolean;
  students: Array<{
    id: string;
    name: string;
    enrollmentId: string;
  }>;
  onParticipantUpdate?: (participants: VideoParticipant[]) => void;
}

export default function MultiStudentVideoGrid({
  sessionId,
  videoToken,
  roomUrl,
  isTutor,
  students,
  onParticipantUpdate,
}: MultiStudentVideoGridProps) {
  const callFrameRef = useRef<DailyCall | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Map<string, VideoParticipant>>(new Map());
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);

  // Initialize Daily.co call
  useEffect(() => {
    if (!videoContainerRef.current || callFrameRef.current) return;

    const initializeCall = async () => {
      try {
        setIsJoining(true);
        setError(null);

        // Create Daily.co call frame
        const callFrame = DailyIframe.createFrame(videoContainerRef.current!, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "8px",
          },
        });

        callFrameRef.current = callFrame;

        // Set up event listeners
        callFrame
          .on("joined-meeting", handleJoinedMeeting)
          .on("participant-joined", handleParticipantJoined)
          .on("participant-updated", handleParticipantUpdated)
          .on("participant-left", handleParticipantLeft)
          .on("error", handleError);

        // Join the meeting
        await callFrame.join({
          url: roomUrl,
          token: videoToken,
        });

        setIsJoined(true);
      } catch (err) {
        console.error("Error joining video call:", err);
        setError(err instanceof Error ? err.message : "Failed to join video call");
      } finally {
        setIsJoining(false);
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [roomUrl, videoToken]);

  // Event handlers
  const handleJoinedMeeting = (event?: DailyEventObjectParticipant) => {
    console.log("Joined meeting:", event);
    setIsJoined(true);
  };

  const handleParticipantJoined = (event?: DailyEventObjectParticipant) => {
    if (!event?.participant) return;
    console.log("Participant joined:", event.participant);
    updateParticipant(event.participant);
  };

  const handleParticipantUpdated = (event?: DailyEventObjectParticipant) => {
    if (!event?.participant) return;
    updateParticipant(event.participant);
  };

  const handleParticipantLeft = (event?: DailyEventObjectParticipant) => {
    if (!event?.participant) return;
    console.log("Participant left:", event.participant);
    
    setParticipants((prev) => {
      const updated = new Map(prev);
      updated.delete(event.participant.session_id);
      return updated;
    });
  };

  const handleError = (event?: any) => {
    console.error("Daily.co error:", event);
    setError(event?.errorMsg || "An error occurred");
  };

  const updateParticipant = (participant: any) => {
    setParticipants((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(participant.session_id);

      updated.set(participant.session_id, {
        userId: participant.user_id || participant.session_id,
        userName: participant.user_name || "Unknown",
        sessionTime: existing?.sessionTime || 0,
        totalTime: existing?.totalTime || 0,
        videoEnabled: participant.video || false,
        audioEnabled: participant.audio || false,
      });

      return updated;
    });
  };

  // Update session timers
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      setParticipants((prev) => {
        const updated = new Map(prev);
        updated.forEach((participant, key) => {
          updated.set(key, {
            ...participant,
            sessionTime: participant.sessionTime + 1,
            totalTime: participant.totalTime + 1,
          });
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isJoined]);

  // Notify parent of participant updates
  useEffect(() => {
    if (onParticipantUpdate) {
      onParticipantUpdate(Array.from(participants.values()));
    }
  }, [participants, onParticipantUpdate]);

  // Video controls
  const toggleVideo = async () => {
    if (!callFrameRef.current) return;
    const newState = !localVideoEnabled;
    await callFrameRef.current.setLocalVideo(newState);
    setLocalVideoEnabled(newState);
  };

  const toggleAudio = async () => {
    if (!callFrameRef.current) return;
    const newState = !localAudioEnabled;
    await callFrameRef.current.setLocalAudio(newState);
    setLocalAudioEnabled(newState);
  };

  const leaveCall = async () => {
    if (!callFrameRef.current) return;
    await callFrameRef.current.leave();
    setIsJoined(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
        {isJoining && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Joining session...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10">
            <div className="text-white text-center p-6">
              <p className="text-xl font-bold mb-2">Connection Error</p>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100"
              >
                Reload Page
              </button>
            </div>
          </div>
        )}

        <div ref={videoContainerRef} className="w-full h-full" />
      </div>

      {/* Video Controls */}
      {isJoined && (
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              localVideoEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {localVideoEnabled ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              localAudioEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={localAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {localAudioEnabled ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          <button
            onClick={leaveCall}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors"
          >
            Leave Session
          </button>

          {/* Participant Count */}
          <div className="ml-auto text-white">
            <span className="text-sm">
              {participants.size} participant{participants.size !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Participant Info (for debugging/monitoring) */}
      {isTutor && isJoined && (
        <div className="p-2 bg-gray-100 text-xs">
          <p className="font-semibold mb-1">Active Participants:</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(participants.values()).map((p, i) => (
              <span key={i} className="px-2 py-1 bg-white rounded border">
                {p.userName} ({formatTime(p.sessionTime)})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
