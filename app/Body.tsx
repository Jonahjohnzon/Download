import Script from "next/script";
import {Dosis} from "next/font/google";


const dosis = Dosis({ subsets: ['latin'] })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Body = ({children}:any) => {
  return (
    <body  className={` ${dosis.className} antialiased select-none`}
    suppressHydrationWarning>
      <Script
        // src="https://quge5.com/88/tag.min.js"
        // strategy="afterInteractive"
        // data-zone="246496"
        // data-cfasync="false"
      />
      {children}</body>
  )
}

export default Body