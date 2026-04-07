import React from 'react';

interface BookLoaderProps {
  className?: string;
  label?: string;
}

/**
 * Book Loader - Sách lật animation cho Teacher Web
 *
 * Component tự chứa CSS, không phụ thuộc index.css.
 * Màu sắc: dark green theme phù hợp teacher-web.
 */
export default function BookLoader({ className = '', label = 'LOADING' }: BookLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <style>{`
        .book-container {
          perspective: 1200px;
          width: 12em;
          height: 8em;
          position: relative;
        }

        .book-cover {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #4A6F5E;
          background-image: linear-gradient(135deg, #4A6F5E 0%, #3D5F50 100%);
          border-radius: 8px;
          box-shadow: 0 1.5em 3em rgba(0,0,0,0.2);
        }

        .book-spine {
          background: rgba(0,0,0,0.4);
          width: 4px;
          height: calc(100% - 0.8em);
          position: absolute;
          left: 50%;
          top: 0.4em;
          transform: translateX(-50%);
          z-index: 200;
          border-radius: 2px;
        }

        .page {
          position: absolute;
          left: 50%;
          top: 0.4em;
          width: calc(50% - 0.4em);
          height: calc(100% - 0.8em);
          transform-origin: left center;
          transform-style: preserve-3d;
        }

        .page-1 { animation: flip-cycle 8s infinite 0.0s ease-in-out; }
        .page-2 { animation: flip-cycle 8s infinite 0.4s ease-in-out; }
        .page-3 { animation: flip-cycle 8s infinite 0.8s ease-in-out; }
        .page-4 { animation: flip-cycle 8s infinite 1.2s ease-in-out; }
        .page-5 { animation: flip-cycle 8s infinite 1.6s ease-in-out; }

        .page-side {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background-color: white;
          padding: 0.8em;
          display: flex;
          flex-direction: column;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.02);
          border-radius: 0 4px 4px 0;
          border: 1px solid #f1f5f9;
        }

        .page-side.back {
          transform: rotateY(-180deg);
          background-color: #fdfdfd;
          border-radius: 4px 0 0 4px;
          border-right: 2px solid #e2e8f0;
        }

        .page-header {
          font-family: 'Inter', sans-serif;
          font-size: 0.6em;
          color: #4A6F5E;
          font-weight: 800;
          margin-bottom: 0.5em;
          border-bottom: 2px solid #10b98122;
          padding-bottom: 3px;
          text-transform: uppercase;
        }

        .lines {
          flex: 1;
          background-image: repeating-linear-gradient(
            transparent 0,
            transparent 18%,
            #f1f5f9 18%,
            #f1f5f9 20%
          );
          background-size: 100% 1.2em;
        }

        @keyframes flip-cycle {
          0%, 5% {
            transform: rotateY(0deg);
            z-index: 10;
          }
          25% { z-index: 100; }
          40%, 60% {
            transform: rotateY(-180deg);
            z-index: 10;
          }
          75% { z-index: 100; }
          95%, 100% {
            transform: rotateY(0deg);
            z-index: 10;
          }
        }

        .book-shadow {
          position: absolute;
          bottom: -2.5em;
          width: 80%;
          height: 1em;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, transparent 75%);
          filter: blur(8px);
          left: 10%;
        }

        .book-dots {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }

        .book-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #3D5F50;
        }

        .book-dot:nth-child(1) { animation: dot-bounce 1s infinite ease-in-out 0s; }
        .book-dot:nth-child(2) { animation: dot-bounce 1s infinite ease-in-out 0.2s; }
        .book-dot:nth-child(3) { animation: dot-bounce 1s infinite ease-in-out 0.4s; }

        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="book-container">
        <div className="book-cover" />
        <div className="book-spine" />

        {[
          { front: "Unit 1", back: "Grammar" },
          { front: "Unit 2", back: "Vocabulary" },
          { front: "Unit 3", back: "Reading" },
          { front: "Unit 4", back: "Writing" },
          { front: "Unit 5", back: "Practice" }
        ].map((p, i) => (
          <div key={i} className={`page page-${i + 1}`}>
            <div className="page-side front">
              <span className="page-header">{p.front}</span>
              <div className="lines" />
            </div>
            <div className="page-side back">
              <span className="page-header">{p.back}</span>
              <div className="lines" />
            </div>
          </div>
        ))}

        <div className="book-shadow" />
      </div>

      {label && (
        <div className="mt-12 flex flex-col items-center gap-1.5">
          <div className="text-[11px] tracking-[0.6em] text-[#3D5F50] font-black uppercase">
            {label}
          </div>
          <div className="book-dots">
            <span className="book-dot" />
            <span className="book-dot" />
            <span className="book-dot" />
          </div>
        </div>
      )}
    </div>
  );
}
