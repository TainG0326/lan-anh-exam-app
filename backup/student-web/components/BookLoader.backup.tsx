import React from 'react';

interface BookLoaderProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

/**
 * Book Loader - Sách lật animation
 *
 * Component sách lật animation phù hợp cho:
 * - Trang login / redirect page
 * - Loading state mang tính giáo dục
 * - Trang chờ chuyển hướng
 *
 * Kích thước đã điều chỉnh nhỏ gọn (12em × 8em) để fit trong các context khác nhau.
 *
 * @param primaryColor   - Màu bìa sách, mặc định dùng primary token
 * @param secondaryColor - Gradient endpoint, mặc định dùng primary-dark
 * @param accentColor    - Accent cho border header, mặc định dùng primary-light
 */
const BookLoader: React.FC<BookLoaderProps> = ({
  primaryColor = "#7BA389",
  secondaryColor = "#5C8A6E",
  accentColor = "#9DC4AB"
}) => {
  // Cấu trúc: Front (bên phải - Unit), Back (bên trái - Nội dung)
  const pages = [
    { front: "Unit 1", back: "Grammar" },
    { front: "Unit 2", back: "Vocabulary" },
    { front: "Unit 3", back: "Reading" },
    { front: "Unit 4", back: "Writing" },
    { front: "Unit 5", back: "Practice" }
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[320px] bg-slate-50">
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
          background: ${primaryColor};
          background-image: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
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

        .page-1 { animation: flip-cycle 4s infinite 0.0s ease-in-out; }
        .page-2 { animation: flip-cycle 4s infinite 0.2s ease-in-out; }
        .page-3 { animation: flip-cycle 4s infinite 0.4s ease-in-out; }
        .page-4 { animation: flip-cycle 4s infinite 0.6s ease-in-out; }
        .page-5 { animation: flip-cycle 4s infinite 0.8s ease-in-out; }

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
          color: ${primaryColor};
          font-weight: 800;
          margin-bottom: 0.5em;
          border-bottom: 2px solid ${accentColor}22;
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
          0%, 10% {
            transform: rotateY(0deg);
            z-index: 10;
          }
          25% {
            z-index: 100;
          }
          40%, 60% {
            transform: rotateY(-180deg);
            z-index: 10;
          }
          75% {
            z-index: 100;
          }
          90%, 100% {
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
      `}</style>

      <div className="book-container">
        <div className="book-cover" />
        <div className="book-spine" />

        {pages.map((p, i) => (
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

      <div className="mt-12 text-center">
        <p className="text-[14px] font-black tracking-[0.6em] uppercase text-emerald-950 opacity-80 drop-shadow-sm ml-[0.6em]">
          LOADING
        </p>
        <div className="flex justify-center gap-1 mt-1">
          <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default BookLoader;
