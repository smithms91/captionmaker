'use client';

import React, { useState } from 'react'
import UploadIcon from './UploadIcon'
import axios from 'axios';
import { useRouter } from 'next/navigation';

type Props = {}

const UploadForm = (props: Props) => {

  const [uploading, setUploading] = useState(false);
  const router = useRouter();


  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const files = e.target.files

    if (files && files.length > 0) {
      const file = files[0];
      setUploading(true);
      const response = await axios.postForm('/api/upload', { file });
      setUploading(false);
      const newName = response.data.newName;
      router.push(`/${newName}`);
    }
  }

  return (
    <>
      {uploading && (
        <div className='bg-black/90 text-white fixed inset-0 flex items-center'>
          <div className='w-full text-center'>
            <h2 className='text-4xl mb-4'>Uploading...</h2>
            <h3 className='text-xl'>Please wait</h3>
          </div>
        </div>
      )}
      <label className="bg-green-600 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer">
        <UploadIcon />
        <span>Choose File</span>
        <input onChange={upload} type="file" className="hidden" />
      </label>
    </>
  )
}

export default UploadForm