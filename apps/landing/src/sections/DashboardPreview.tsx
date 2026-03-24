import Image from "next/image";

const DashboardPreview = () => {
  return (
    <div className="w-full max-w-5xl mt-8 px-2 md:px-0">
      <div className="rounded-2xl overflow-hidden p-2 md:p-3 bg-accent/13 backdrop-blur-lg border">
        <div className="rounded-xl overflow-hidden bg-background/60">
          <Image
            src="/landing/desktop.png"
            alt="Dashboard preview"
            width={1915}
            height={961}
            quality={100}
            priority
            className="hidden lg:block w-full h-auto"
            sizes="(min-width: 1280px) 1280px, 100vw"
          />
          <Image
            src="/landing/tab.png"
            alt="Dashboard preview"
            width={2048}
            height={1536}
            quality={100}
            className="hidden md:block lg:hidden w-full h-auto"
            sizes="(min-width: 768px) 100vw, 0px"
          />
          <Image
            src="/landing/phone.png"
            alt="Dashboard preview"
            width={1535}
            height={2047}
            quality={100}
            className="block md:hidden w-full h-auto"
            sizes="100vw"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
