import { proxy } from "valtio";
import { ListServer } from "./Player/ListServers";
export const store = proxy({
    Server:  ListServer[0],
    ServerinUse:ListServer[0].name,
    Check:false,
    loading:false,
    loadingServer:false,
    Type:"",
    Season:"",
    Episode:"",
    M3u8Url:"",
    title:"",
    ParamId:"",
    tokencode:"",
    token:false,
    sources: [] as {
    url: string;
    type: string;
    quality: string;
    label: string;
    size:string;
    audioTracks: {
      label: string;
      language: string;
      url: string | null;
    }[]
  }[],
  subtitles: [] as {
    url: string;
    format: string;
    label: string;
  }[],
    error:false,
    type:"movie",
    url:"",
    poster : "",
    backdrop : "",
    overview : "",
    tryingServer: null as string | null,
    serverFailed: null as string | null,
    mainType: {
    url: '',
    type: 'application/x-mpegurl',
    quality: '',
    label: '',
    audioTracks: [],
    }
});