import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Video, Segment, supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Loader } from 'lucide-react';

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideoAndSegments() {
      try {
        if (!id) throw new Error('Video ID is required');

        const [videoResult, segmentsResult] = await Promise.all([
          supabase.from('videos').select('*').eq('id', id).single(),
          supabase.from('segments').select('*').eq('video_id', id).order('segment_no'),
        ]);

        if (videoResult.error) throw videoResult.error;
        if (segmentsResult.error) throw segmentsResult.error;

        setVideo(videoResult.data);
        setSegments(segmentsResult.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch video details');
      } finally {
        setLoading(false);
      }
    }

    fetchVideoAndSegments();
  }, [id]);

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error || 'Video not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Videos
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">{video.title}</h1>

      <div className="space-y-8">
        {segments.map((segment) => (
          <div key={segment.id} className="space-y-4">
            {/* Text Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">
                  {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Chapter {segment.segment_no}
              </h3>
              <p className="text-gray-600">{segment.summary}</p>
            </div>

            {/* Thumbnail Image */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video">
                <img
                  src={segment.thumbnail_url}
                  alt={`Thumbnail for chapter ${segment.segment_no}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        ))}
        {segments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No chapters available for this video
          </div>
        )}
      </div>
    </div>
  );
}