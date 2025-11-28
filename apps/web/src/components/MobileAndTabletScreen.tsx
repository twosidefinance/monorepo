import Image from "next/image";

export default function MobileAndTabletScreen() {
  return (
    <div className="w-screen h-screen">
      <div className="w-full h-full flex items-center justify-center flex-col">
        <Image
          height={200}
          width={200}
          src={"/twoside-bold.png"}
          alt="Twoside Logo"
        />
        <p className="mt-4 w-full text-center px-20 md:px-60">
          Twoside only supports browser extensions right now. Use a laptop/PC to
          use Twoside. We will add support for mobile phones and tablets soon.
        </p>
      </div>
    </div>
  );
}
