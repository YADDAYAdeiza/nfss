import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental:{
    serverActions:{
      bodySizeLimit:"100MB",
    },
  },
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:"hwchamber.co.uk",
      },{
        protocol:'https',
        hostname:'cloud.appwrite.io',
      }
    ]
  }
};

export default nextConfig;
