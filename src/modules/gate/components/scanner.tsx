"use client";

import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAcceptableScan } from "@/modules/gate/utils/scan";
import { Button, Icon } from "@/ui";

const FRAME_INTERVAL_MS = 125; // ~8fps

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function getBarcodeDetector():
  | (new (options: {
      formats: string[];
    }) => BarcodeDetectorLike)
  | null {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }
  return (
    window as unknown as {
      BarcodeDetector: new (options: { formats: string[] }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
}

export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const stopTracks = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRunning(false);
  }, []);

  const handleDecode = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!isAcceptableScan(value) || pausedRef.current) {
        return;
      }
      pausedRef.current = true;
      stopTracks();
      onCode(value);
    },
    [onCode, stopTracks],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopTracks();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopTracks();
    };
  }, [stopTracks]);

  async function start() {
    setError("");
    pausedRef.current = false;
    stopTracks();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopTracks();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setRunning(true);

      const Detector = getBarcodeDetector();
      if (Detector) {
        const detector = new Detector({ formats: ["qr_code"] });
        let last = 0;
        const scan = async (time: number) => {
          if (pausedRef.current) {
            return;
          }
          if (time - last >= FRAME_INTERVAL_MS && videoRef.current) {
            last = time;
            try {
              const codes = await detector.detect(videoRef.current);
              const raw = codes[0]?.rawValue;
              if (raw) {
                handleDecode(raw);
                return;
              }
            } catch {
              // Continue scanning if a frame fails.
            }
          }
          frameRef.current = requestAnimationFrame(scan);
        };
        frameRef.current = requestAnimationFrame(scan);
        return;
      }

      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      let last = 0;
      const scan = () => {
        if (pausedRef.current) {
          return;
        }
        const element = videoRef.current;
        if (element && context && performance.now() - last >= FRAME_INTERVAL_MS) {
          last = performance.now();
          const width = element.videoWidth;
          const height = element.videoHeight;
          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(element, 0, 0);
            const image = context.getImageData(0, 0, width, height);
            const code = jsQR(image.data, image.width, image.height);
            if (code?.data) {
              handleDecode(code.data);
              return;
            }
          }
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setError("Camera access is unavailable. Enter the code manually.");
      stopTracks();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <video
        ref={videoRef}
        playsInline
        muted
        className="aspect-video w-full rounded-lg bg-ink"
        aria-label="Camera preview for scanning visitor QR codes"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button type="button" size="lg" onClick={() => void start()} disabled={running}>
          <Icon icon={Camera} size={24} />
          {running ? "Scanning…" : "Start camera"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={stopTracks} disabled={!running}>
          <Icon icon={CameraOff} size={24} />
          Stop camera
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">
        Point the camera at the visitor QR code. You can also enter the code manually on the gate
        screen.
      </p>
    </div>
  );
}
