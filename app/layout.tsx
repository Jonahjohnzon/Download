
import "./globals.css";
import Body from "./Body";


const baseURL =  "https://api.screenopps.com"
export const metadata = {
  manifest:"/manifest.json",
  title:{
    default: 'Screenopps || Movie and Entertainment API'},
    icons:{
        icon: '/logologo.png',        // from public folder
      shortcut: '/logologo.png',
      apple: '/logologo.png',       // iOS home screen icon
    },
    metadataBase: new URL(`${baseURL}`),
    openGraph: {
      title: 'Screenopps | Entertainment and Movie API',
      description: 'Screenopps offers streaming links for movies and episodes that can be effortlessly integrated into your website through embed links, API, or WordPress plugins',
      images:[{url:`${baseURL}/opengraph-image.png`, width:1200, height:630}]
      ,
      url:`${baseURL}`,
      type:"website"
      ,
    twitter:{
      card:"summary_large_image"
    }
     
    }
,
  description: 'Screenopps offers streaming links for movies and episodes that can be effortlessly integrated into your website through embed links, API, or WordPress plugins',
  keywords:['movie download','telenovela dub','telenovela english dub', 'telenovela english','telenovela sub', 'telenovela english sub','telenovela english subtitle', 'telenovela subtitle','spanish series','telemundo' ,'movie streaming', 'free movies online', 'free movie websites', 'new movies to stream', 'watch free movies', 'best streaming services', 'free full movies', 'freevee movies', 'free movie sites', 'movies online', 'free streaming sites', 'watch movies free online', 'free tv shows', 'watch free movies online free', 'watch free movies online without registration', 'watch movies', 'download movies free', 'free movies online sites', 'free new movies online', 'free movie streaming sites', 'best streaming movies',"netnaija", "nkiri", "download free movie", "fzmovies", "godzilla","tvseries","download free tvseries"," download free kseries ","korean series","bollywood","latest movies", "download latest movies", "download latest series","download movies from fzmovies", "download movies from telegram", "download movies from moviebox", "knuckles", "download knuckles free", "download godzilla x kong", "godzilla x kong", "stream godzilla x kong free", "stream godzilla x kong", "latest movies", "latest movies download", "latest free movies download","nollywood movies","nollywood movies download","soo ji and woo ri", "in cold blood","korean series", "k-drama download","korean series series", "boys be brave", "download boys be brave", "download boys be brave free", "latest korean series download","site to download korean series", "free site to download korean series","best site to download korean series","download spanish series with subtitle","download spanish series","download second chance","download telenovalas","download telenovalas with subtitle","pirate movies download"],
  creator: 'Luzz Knight',
  alternates:{
    canonical:`${baseURL}`
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <head><meta name="monetag" content="f812d08ef1bb5d01aaa6bdb313c1d2e4" suppressHydrationWarning/>
      <link rel="icon" href="/logologo.png" sizes="any" />
         </head>
      <Body >{children}</Body>
    </html>
  );
}
