import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Music, Folder, Play } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Component() {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [outputName, setOutputName] = useState('awesome_video');
  const [fps, setFps] = useState(10);
  const [music, setMusic] = useState('None');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = new FFmpeg();
      ffmpegInstance.on('log', ({ message }) => {
        console.log(message);
      });
      ffmpegInstance.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      await ffmpegInstance.load();
      setFFmpeg(ffmpegInstance);
    };
    loadFFmpeg();
  }, []);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      ).sort((a, b) => a.name.localeCompare(b.name)); // Sort files by name
      setImageFiles(imageFiles);
      setSelectedFolder(`${imageFiles.length} images selected`);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!ffmpeg || imageFiles.length === 0) return;

    setIsConverting(true);
    setProgress(0);

    try {
      // Write image files to FFmpeg's virtual file system
      for (let i = 0; i < imageFiles.length; i++) {
        const fileName = `image${i.toString().padStart(5, '0')}.jpg`;
        await ffmpeg.writeFile(fileName, await fetchFile(imageFiles[i]));
      }

      // Create a file with the list of images
      const fileList = imageFiles.map((_, index) => {
        return `file 'image${index.toString().padStart(5, '0')}.jpg'`;
      }).join('\n');
      await ffmpeg.writeFile('fileList.txt', fileList);

      // Run FFmpeg command to convert images to video
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'fileList.txt',
        '-framerate', fps.toString(),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        'output.mp4'
      ]);

      // Read the output video file
      const data = await ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(videoUrl);

      setIsConverting(false);
      setProgress(100);
    } catch (error) {
      console.error('Conversion error:', error);
      setIsConverting(false);
    }
  }, [ffmpeg, imageFiles, fps]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 p-8 text-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-6 text-center">Image2Video</h1>
          
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white py-3 rounded-lg mb-6 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFolderSelect}
              className="hidden"
              aria-label="Select image files"
            />
            <Folder className="w-5 h-5" />
            <span>Select Images</span>
          </motion.label>
          
          {selectedFolder && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 text-sm"
            >
              {selectedFolder}
            </motion.p>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="outputName" className="block text-sm font-medium mb-1">Output Name</label>
              <input
                id="outputName"
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full bg-white bg-opacity-20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="awesome_video"
              />
            </div>
            
            <div>
              <label htmlFor="fps" className="block text-sm font-medium mb-1">Images per Second</label>
              <div className="relative">
                <select
                  id="fps"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-white bg-opacity-20 rounded-lg py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[5, 10, 15, 20, 25, 30].map((value) => (
                    <option key={value} value={value}>{value} FPS</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label htmlFor="music" className="block text-sm font-medium mb-1">Background Music</label>
              <div className="relative">
                <select
                  id="music"
                  value={music}
                  onChange={(e) => setMusic(e.target.value)}
                  className="w-full bg-white bg-opacity-20 rounded-lg py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['None', 'Upbeat', 'Relaxing', 'Energetic', 'Custom...'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <Music className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg mt-6 flex items-center justify-center space-x-2"
            onClick={handleConvert}
            disabled={isConverting || imageFiles.length === 0}
          >
            <Play className="w-5 h-5" />
            <span>{isConverting ? 'Converting...' : 'Convert to Video'}</span>
          </motion.button>
          
          {(isConverting || progress > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center mt-2">{progress}% Complete</p>
            </motion.div>
          )}

          {videoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h2 className="text-xl font-semibold mb-2">Your Video is Ready!</h2>
              <video controls className="w-full rounded-lg">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <a
                href={videoUrl}
                download={`${outputName}.mp4`}
                className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-4"
              >
                Download Video
              </a>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


