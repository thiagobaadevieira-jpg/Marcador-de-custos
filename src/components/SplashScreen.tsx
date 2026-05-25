import { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Small delay before starting animation
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;

      const anime = (await import("animejs")).default;

      if (!svgRef.current || cancelled) return;

      const cutLayer = svgRef.current.querySelector("#cutLayer");
      if (!cutLayer) return;

      // Create drawable for the cut layer paths
      const drawable = anime.svg.createDrawable(cutLayer as SVGElement);

      await anime(drawable, {
        draw: ["0 0", "0 1"],
        ease: "inOutSine",
        duration: 2800,
      }).finished;

      if (cancelled) return;

      // Fade out after animation completes
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      setFading(true);

      // Wait for fade transition then call onFinish
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      onFinish();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #1a1f35 0%, #0d1117 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease",
      }}
    >
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 652 652"
        width="260"
        height="260"
        style={{ display: "block" }}
      >
        <defs>
          <filter id="paperTexture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a3050" />
            <stop offset="100%" stopColor="#161929" />
          </radialGradient>
        </defs>

        {/* Background circle */}
        <circle cx="326" cy="326" r="300" fill="url(#bgGrad)" opacity="0.6" />

        {/* Layer 4 - background landscape */}
        <g id="layer4" opacity="0.35" fill="none" stroke="#7c9cbf" strokeWidth="0.8">
          <path d="M 80 480 Q 160 400 240 440 Q 300 420 360 450 Q 430 410 520 460 L 540 520 L 60 520 Z" fill="#2a4060" stroke="none" opacity="0.5" />
          <path d="M 100 440 Q 140 380 180 400 Q 220 370 260 390 Q 300 360 340 380 L 360 440 Z" fill="#1e3050" stroke="none" opacity="0.4" />
        </g>

        {/* Layer 3 - mountains/trees silhouette */}
        <g id="layer3" opacity="0.4" fill="#1a2840">
          <path d="M 50 500 L 120 360 L 190 500 Z" />
          <path d="M 130 500 L 200 380 L 270 500 Z" />
          <path d="M 400 500 L 470 370 L 540 500 Z" />
          <path d="M 460 500 L 530 400 L 600 500 Z" />
          <rect x="40" y="500" width="580" height="60" fill="#1a2840" />
        </g>

        {/* Layer 2 - deer body silhouette (filled) */}
        <g id="layer2" fill="#0f1624" opacity="0.9">
          {/* Body */}
          <ellipse cx="326" cy="360" rx="85" ry="60" />
          {/* Head */}
          <ellipse cx="370" cy="280" rx="35" ry="28" />
          {/* Neck */}
          <path d="M 345 305 Q 355 320 345 345 Q 335 335 340 308 Z" />
          {/* Legs */}
          <rect x="270" y="400" width="14" height="90" rx="7" />
          <rect x="300" y="405" width="14" height="85" rx="7" />
          <rect x="345" y="405" width="14" height="88" rx="7" />
          <rect x="375" y="398" width="14" height="92" rx="7" />
          {/* Tail */}
          <ellipse cx="245" cy="345" rx="12" ry="18" />
          {/* Ear */}
          <path d="M 375 262 Q 390 240 395 255 Q 388 270 378 268 Z" />
          <path d="M 352 258 Q 355 235 365 245 Q 363 262 355 262 Z" />
          {/* Antlers */}
          <path d="M 365 258 Q 355 220 345 200 Q 340 185 330 175 M 345 200 Q 330 195 320 185 M 345 200 Q 355 190 360 178" stroke="#0f1624" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 375 255 Q 385 215 395 192 Q 400 178 410 168 M 395 192 Q 410 188 420 178 M 395 192 Q 382 185 378 170" stroke="#0f1624" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>

        {/* Layer 1 - animated outline (the "cut" that gets drawn) */}
        <g
          id="cutLayer"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Deer body outline */}
          <path
            d="M 245 360 Q 255 310 285 295 Q 300 288 316 290 Q 330 285 345 290 Q 365 285 385 300 Q 408 315 412 345 Q 415 375 400 400 Q 385 420 355 428 Q 330 432 305 425 Q 270 415 255 395 Q 240 378 245 360 Z"
            stroke="#7eb8e0"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* Head */}
          <path
            d="M 340 265 Q 352 252 368 255 Q 390 258 400 275 Q 408 292 402 308 Q 395 322 378 325 Q 360 328 348 318 Q 335 308 336 292 Q 336 278 340 265 Z"
            stroke="#7eb8e0"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* Neck */}
          <path
            d="M 348 320 Q 342 335 340 350 M 370 322 Q 366 337 362 350"
            stroke="#7eb8e0"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Antlers */}
          <path
            d="M 355 260 Q 350 238 342 218 Q 338 204 328 192 M 342 218 Q 328 210 318 200 M 342 218 Q 350 206 354 194"
            stroke="#9ecfe8"
            strokeWidth="1.8"
            opacity="0.9"
          />
          <path
            d="M 368 258 Q 378 234 388 212 Q 394 196 404 184 M 388 212 Q 402 206 412 196 M 388 212 Q 376 202 374 188"
            stroke="#9ecfe8"
            strokeWidth="1.8"
            opacity="0.9"
          />
          {/* Ear left */}
          <path
            d="M 352 260 Q 348 240 356 232 Q 364 238 364 255"
            stroke="#7eb8e0"
            strokeWidth="1.2"
            opacity="0.8"
          />
          {/* Ear right */}
          <path
            d="M 374 258 Q 384 240 394 248 Q 394 262 382 266"
            stroke="#7eb8e0"
            strokeWidth="1.2"
            opacity="0.8"
          />
          {/* Legs */}
          <path d="M 278 418 Q 276 450 274 490 Q 272 505 278 505 Q 284 505 284 490 Q 284 450 284 418" stroke="#7eb8e0" strokeWidth="1.3" opacity="0.8" />
          <path d="M 308 422 Q 308 460 306 492 Q 305 507 312 507 Q 318 507 318 492 Q 317 460 316 422" stroke="#7eb8e0" strokeWidth="1.3" opacity="0.8" />
          <path d="M 352 424 Q 352 462 350 494 Q 349 509 356 509 Q 362 509 362 494 Q 361 462 360 424" stroke="#7eb8e0" strokeWidth="1.3" opacity="0.8" />
          <path d="M 384 418 Q 386 456 386 490 Q 386 505 392 505 Q 398 505 396 490 Q 394 456 392 418" stroke="#7eb8e0" strokeWidth="1.3" opacity="0.8" />
          {/* Tail */}
          <path
            d="M 248 338 Q 238 348 238 360 Q 238 375 248 380 Q 258 385 264 376 Q 270 365 264 352 Q 260 342 248 338 Z"
            stroke="#7eb8e0"
            strokeWidth="1.2"
            opacity="0.7"
          />
          {/* Eye */}
          <circle cx="385" cy="282" r="4" stroke="#b0d8f0" strokeWidth="1.5" opacity="0.9" />
          {/* Ground line */}
          <path
            d="M 160 510 Q 250 505 326 506 Q 420 505 500 510"
            stroke="#4a6fa0"
            strokeWidth="1"
            opacity="0.5"
            strokeDasharray="4 6"
          />
          {/* Stars / ambient details */}
          <circle cx="150" cy="160" r="1.5" stroke="#a0c4e0" strokeWidth="1" opacity="0.6" />
          <circle cx="480" cy="140" r="1" stroke="#a0c4e0" strokeWidth="1" opacity="0.5" />
          <circle cx="200" cy="200" r="1" stroke="#a0c4e0" strokeWidth="1" opacity="0.4" />
          <circle cx="520" cy="220" r="1.5" stroke="#a0c4e0" strokeWidth="1" opacity="0.5" />
          <circle cx="130" cy="300" r="1" stroke="#a0c4e0" strokeWidth="1" opacity="0.4" />
        </g>
      </svg>

      {/* App name below */}
      <p
        className="mt-8 text-sm font-semibold tracking-widest uppercase"
        style={{
          color: "rgba(126, 184, 224, 0.7)",
          letterSpacing: "0.25em",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        Controle de Gastos
      </p>
    </div>
  );
}
