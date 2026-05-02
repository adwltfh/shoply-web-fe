"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="max-w-5xl mt-4">
      <div className="relative bg-gradient-to-tr from-orange-300 to-orange-500 rounded-xl px-8 md:px-16 py-6 md:py-10 flex flex-row items-end justify-between overflow-hidden min-h-[240px] md:min-h-[360px] shadow-lg">
        {/* LEFT CONTENT */}
        <div className="w-1/2 text-white text-left z-10 pb-2 md:pb-4">
          <h1 className="text-2xl md:text-5xl font-extrabold leading-tight mb-3 md:mb-5">
            Find Everything
            <br />
            You Need
          </h1>
          <p className="text-sm md:text-lg mb-5 md:mb-8 font-normal text-white/90">
            Discover amazing products
            <br />
            at great prices
          </p>
          <button className="bg-white text-orange-500 text-sm md:text-base px-6 py-3 rounded-xl font-semibold shadow hover:bg-orange-100 transition-all">
            Shop Now
          </button>
        </div>
        {/* RIGHT IMAGE */}
        <Image
          src="/hero-img.png"
          alt="shopping"
          width={500}
          height={500}
          className="absolute top-1 bottom-0 right-0 w-[320px] md:w-[600px] h-[300px] md:h-[auto] object-cover select-none z-0"
          draggable={false}
        />
      </div>
    </section>
  );
}
