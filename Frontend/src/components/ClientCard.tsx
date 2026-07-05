// src/components/ClientCard.tsx
import React from 'react';
import { Client } from '@/data/clients';

interface ClientCardProps {
  client: Client;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6 border border-gray-100 group">
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0f1729] via-[#1e3a8a] to-[#0891b2] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <span className="text-white text-2xl font-bold">
            {client.name.charAt(0)}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0f1729] mb-1 group-hover:text-[#2563eb] transition-colors">
            {client.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {client.location}
          </p>

          {client.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {client.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {client.students && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {client.students.toLocaleString()} students
              </span>
            )}
            {client.since && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Since {client.since}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;