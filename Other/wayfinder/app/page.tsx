import HomeComponent from "@/components/General/HomeComponent";

export const metadata = {
  title: "Home | Wayfinder®",
  description: "Navigate Singapore with ease using Wayfinder®",
  openGraph: {
    title: "Home | Wayfinder®",
    description: "Navigate Singapore with ease using Wayfinder®",
    url: "https://wayfinder.ink/home",
    siteName: "Wayfinder",
    images: [
      {
        url: "/wayfinder.png",
        width: 800,
        height: 800,
        alt: "Wayfinder Photo",
      },
    ],
    locale: "en_SG",
    type: "website",
  },
};

export default function Home() {
  return <HomeComponent />;
}
