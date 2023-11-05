'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { clearTranscriptionItems } from '@/app/libs/awsTranscriptionHelpers';

import ResultVideo from '@/components/ResultVideo';
import TranscriptionEditor from '@/components/TranscriptionEditor';


const FilePage = ({ params }: any) => {
  const fileName = params.fileName;
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [awsTranscriptionItems, setAwsTranscriptionItems] = useState([]);
  useEffect(() => {
    getTranscription();
  }, [fileName])

  function getTranscription() {
    setIsFetchingInfo(true);
    axios.get('/api/transcribe?fileName=' + fileName).then((response) => {
      setIsFetchingInfo(false);
      const status = response.data?.status;
      const transcription = response.data?.transcription;

      if (status === 'IN_PROGRESS') {
        setIsTranscribing(true)
        setTimeout(() => { getTranscription() }, 3000)
      } else {
        setIsTranscribing(false)
        setAwsTranscriptionItems(clearTranscriptionItems(transcription.results.items));
      }
    })
  }

  if (isTranscribing) return <div>Transcribing...</div>
  if (isFetchingInfo) return <div>Fetching info...</div>

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-8 sm:gap-16">
        <div className="">
          <h2 className="text-2xl mb-4 text-white/60">Transcription</h2>
          <TranscriptionEditor
            awsTranscriptionItems={awsTranscriptionItems}
            setAwsTranscriptionItems={setAwsTranscriptionItems} />
        </div>
        <div>
          <h2 className="text-2xl mb-4 text-white/60">Result</h2>
          <ResultVideo
            fileName={fileName}
            transcriptionItems={awsTranscriptionItems} />
        </div>
      </div>
    </div>
  )
}

export default FilePage
