"use server";

import { db } from "../../lib/db";
import { getOrCreateDbUser } from "../../lib/auth";

export async function getNotifications() {
  const user = await getOrCreateDbUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return notifications.map(n => {
    // Basic time formatter
    const diff = new Date().getTime() - n.createdAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor(diff / (1000 * 60));
    
    let timeString = 'just now';
    if (days > 0) timeString = `${days} day${days > 1 ? 's' : ''} ago`;
    else if (hours > 0) timeString = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    else if (minutes > 0) timeString = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    return {
      id: n.id,
      title: n.title,
      message: n.message,
      time: timeString,
      read: n.read,
    };
  });
}

export async function markNotificationRead(id: string) {
  const user = await getOrCreateDbUser();
  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  return { success: true };
}

export async function markAllNotificationsRead() {
  const user = await getOrCreateDbUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return { success: true };
}

// Utility for creating notifications from other server actions
export async function createNotification(userId: string, title: string, message: string) {
  await db.notification.create({
    data: {
      userId,
      title,
      message,
    }
  });
}
