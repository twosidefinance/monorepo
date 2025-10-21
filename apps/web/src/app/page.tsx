"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto min-h-screen flex items-center z-30">
      <div className="px-80">
        Twoside is a locking protocol where users can lock their tokens ($TKN)
        and get derivate tokens in in return ($bTKN). Users can use their
        derivative tokens to unlock their original tokens. The exchange ratio is
        1:1, you get an equal amount of tokens in return of locking and
        unlocking. Go to{" "}
        <Link className="underline underline-offset-4" href={"/dashboard"}>
          Dashboard
        </Link>{" "}
        for Twoside's dashboard.
      </div>
    </div>
  );
}
