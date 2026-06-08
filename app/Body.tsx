
import {Dosis} from "next/font/google";


const dosis = Dosis({ subsets: ['latin'] })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Body = ({children}:any) => {
  return (
    <body  className={` ${dosis.className} antialiased select-none`}
    suppressHydrationWarning>
  
      {children}</body>
  )
}

export default Body