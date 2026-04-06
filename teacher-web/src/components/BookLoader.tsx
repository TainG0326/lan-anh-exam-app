import React from 'react';

type BookLoaderProps = {
  className?: string;
  label?: string;
};

export default function BookLoader({ className = '', label = 'LOADING' }: BookLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="book-loader" aria-hidden="true">
        <div className="book-loader__book">
          <div className="book-loader__cover" />
          <div className="book-loader__spine" />
          <div className="book-loader__page book-loader__page--1" />
          <div className="book-loader__page book-loader__page--2" />
          <div className="book-loader__page book-loader__page--3" />
        </div>
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <div className="text-[11px] tracking-[0.35em] text-[#4A6F5E] font-semibold">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="book-loader__dot" />
          <span className="book-loader__dot book-loader__dot--2" />
          <span className="book-loader__dot book-loader__dot--3" />
        </div>
      </div>
    </div>
  );
}
