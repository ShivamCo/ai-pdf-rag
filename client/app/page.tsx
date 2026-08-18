import Image from "next/image";
import FileUpload from "./component/fileUpload";

export default function Home() {
  return (
    <div>
      <div className=" min-w-screen flex  min-h-screen to-gray-950 " >
        <section className=" w-[30vw] flex items-center justify-center border-r-red-500 border-r-2 " >
          <FileUpload/>
        </section>

        <section className=" w-[70vw]flex justify-center " >
          2
        </section>
      </div>
    </div>
  );
}
