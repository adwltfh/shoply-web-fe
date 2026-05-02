import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold text-lg">
      <Image
        src="/logo-1.png"
        alt="Shoply Logo"
        width={100}
        height={100}
        className="object-contain"
      />
    </div>
  );
}