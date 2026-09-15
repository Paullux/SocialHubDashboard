"use client";
import dynamic from "next/dynamic";

const DemoVideoAnalytics = dynamic(() => import("./DemoVideoAnalytics"), {
  ssr: false,
});

export default DemoVideoAnalytics;
