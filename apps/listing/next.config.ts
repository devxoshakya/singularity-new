import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	typedRoutes: true,
	reactCompiler: true,
	typescript : {
		ignoreBuildErrors : true,
	},
	images : {
		unoptimized : true,
	}
};

export default nextConfig;
