"use client";

import { Show } from "@clerk/nextjs";
import LandingPage from "./component/LandingPage";
import AIChat from "./component/chatComponent";

export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <LandingPage />
      </Show>

      <Show when="signed-in">
        <AIChat />
      </Show>
    </>
  );
}


