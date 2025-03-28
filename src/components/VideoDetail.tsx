import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Video, Segment, supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 1000;

  useEffect(() => {
    async function fetchVideoAndSegments() {
      try {
        if (!id) throw new Error('Video ID is required');

        const [videoResult, countResult, segmentsResult] = await Promise.all([
          supabase.from('videos').select('*').eq('id', id).single(),
          supabase.from('segments').select('*', { count: 'exact', head: true }).eq('video_id', id),
          supabase
            .from('segments')
            .select('*')
            .eq('video_id', id)
            .order('segment_no')
            .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1),
        ]);

        if (videoResult.error) throw videoResult.error;
        if (segmentsResult.error) throw segmentsResult.error;
        if (countResult.error) throw countResult.error;

        setVideo(videoResult.data);
        setSegments(segmentsResult.data || []);
        setTotalCount(countResult.count || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch video details');
      } finally {
        setLoading(false);
      }
    }

    fetchVideoAndSegments();
  }, [id, currentPage]);

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">
                Chapter {segment.segment_no} ({formatTime(segment.start_time)} - {formatTime(segment.end_time)})
              </h3>
              <p className="text-gray-600">{segment.summary}</p>
            </div>

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

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}