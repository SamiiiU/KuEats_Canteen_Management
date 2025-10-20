import React, { useEffect, useState } from 'react';
import { Star, Calendar } from 'lucide-react';
import { supabase, Review } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    loadCanteenData();
  }, [user]);

  useEffect(() => {
    if (canteenId) {
      loadReviews();
    }
  }, [canteenId]);

  useEffect(() => {
    calculateStats();
  }, [reviews]);

  const loadCanteenData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('canteens')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data) {
      setCanteenId(data.id);
    }
  };

  const loadReviews = async () => {
    if (!canteenId) return;

    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('canteen_id', canteenId)
      .order('created_at', { ascending: false });

    setReviews(data || []);
  };

  const calculateStats = () => {
    if (reviews.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
      });
      return;
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = [0, 0, 0, 0, 0];

    reviews.forEach((review) => {
      distribution[review.rating - 1]++;
    });

    setStats({
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = ratingFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.rating === ratingFilter);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#831615' }}>Reviews</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Rating</h3>
          <div className="flex items-end space-x-2 mb-2">
            <p className="text-4xl font-bold" style={{ color: '#831615' }}>
              {stats.averageRating.toFixed(1)}
            </p>
            <span className="text-gray-500 text-lg mb-1">/ 5</span>
          </div>
          {renderStars(Math.round(stats.averageRating))}
          <p className="text-sm text-gray-600 mt-2">{stats.totalReviews} total reviews</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating - 1];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-8">{rating} ★</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: '#831615',
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === 'all'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={ratingFilter === 'all' ? { backgroundColor: '#831615' } : {}}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(rating)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  ratingFilter === rating
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={ratingFilter === rating ? { backgroundColor: '#831615' } : {}}
              >
                {rating} ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{review.customer_name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(review.created_at).toLocaleString()}
                </div>
              </div>
              {renderStars(review.rating)}
            </div>

            {review.comment && (
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">
            {ratingFilter !== 'all'
              ? `No ${ratingFilter}-star reviews yet`
              : 'No reviews yet'}
          </p>
        </div>
      )}
    </div>
  );
};
