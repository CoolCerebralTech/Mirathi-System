import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/common';
import { type WardSummary } from '../../../types/guardianship.types';

interface WardProfileProps {
  ward: WardSummary;
}

export const WardProfile: React.FC<WardProfileProps> = ({ ward }) => {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
        <AvatarImage src={ward.photoUrl} alt={ward.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {ward.name[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold">{ward.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{ward.age} years old</span>
          <span>•</span>
          <span>DOB: {new Date(ward.dateOfBirth).toLocaleDateString()}</span>
          <span>•</span>
          <span className="capitalize">{ward.gender.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
};