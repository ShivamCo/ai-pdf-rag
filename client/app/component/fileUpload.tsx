"use client";

import { Upload } from "lucide-react";
import axios from "axios";

export default function FileUpload() {


    function handleFileUploadClick() {
        const element = document.createElement('input')
        element.setAttribute('type', 'file')
        element.setAttribute('file', 'application/pdf')
        element.click()
        element.addEventListener(
            'change', async(ev) => {

                if (element.files && element.files.length > 0) {
                    const file = element.files.item(0)
                    console.log(element.files.item(0))

                    if (file) {
                        const formData = new FormData()
                        formData.append('pdf', file)
                        const api_url = process.env.NEXT_PUBLIC_API_URL
                        
                        try {

                            const response = await axios.post(
                                api_url+'/upload/pdf', formData
                             )
                             
                        } catch(error){
                            console.log(error)
                        }

                    }
                }



            }
        )




    }

    return (
        <button
            type="button"
            onClick={handleFileUploadClick}
            className="flex h-48 w-2/4 hover:bg-gray-800 cursor-pointer items-center justify-center rounded-3xl border-2 border-gray-700 "
        >
            <Upload />
            <h3 className=" pl-6 ">Upload Your File</h3>
        </button>
    );
}