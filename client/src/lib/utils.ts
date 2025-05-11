import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '$0.00';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericValue);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
};

export const getStatusColor = (statusName: string | null | undefined): string => {
  if (!statusName) return 'bg-neutral-500';
  
  const status = statusName.toLowerCase();
  
  if (status.includes('available')) return 'bg-neutral-500';
  if (status.includes('in use')) return 'bg-green-500';
  if (status.includes('maintenance')) return 'bg-yellow-500';
  if (status.includes('attention') || status.includes('issue') || status.includes('critical')) return 'bg-red-500';
  
  return 'bg-blue-500';
};

export const getIconForAssetType = (assetType: string | null | undefined): string => {
  if (!assetType) return 'devices';
  
  const type = assetType.toLowerCase();
  
  if (type.includes('laptop')) return 'laptop';
  if (type.includes('desktop')) return 'desktop_windows';
  if (type.includes('monitor')) return 'monitor';
  if (type.includes('phone') || type.includes('mobile')) return 'smartphone';
  if (type.includes('tablet')) return 'tablet';
  if (type.includes('printer')) return 'print';
  if (type.includes('server')) return 'dns';
  if (type.includes('network')) return 'router';
  if (type.includes('camera')) return 'photo_camera';
  if (type.includes('audio')) return 'headphones';
  if (type.includes('projector')) return 'video_projector';
  if (type.includes('tv') || type.includes('television')) return 'tv';
  if (type.includes('furniture')) return 'chair';
  if (type.includes('vehicle')) return 'directions_car';
  
  return 'devices';
};

export const generateRandomId = (prefix: string): string => {
  const timestamp = new Date().getTime().toString().slice(-4);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${new Date().getFullYear()}-${timestamp}${random}`;
};
