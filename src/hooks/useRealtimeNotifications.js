// src/hooks/useRealtimeNotifications.js
import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

export function useRealtimeNotifications() {
  const { user, isAdmin } = useAuth();
  const notifiedVehicles = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    // Solicitar permiso para notificaciones si es admin
    if (isAdmin && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: `status=eq.vendido`,
        },
        (payload) => {
          const vehicle = payload.new;
          // Evitar notificar duplicados
          if (notifiedVehicles.current.has(vehicle.id)) return;
          notifiedVehicles.current.add(vehicle.id);

          // Si el usuario es admin, mostrar notificación del navegador
          if (isAdmin && Notification.permission === 'granted') {
            const notification = new Notification('¡Vehículo vendido!', {
              body: `${vehicle.brand} ${vehicle.model} (${vehicle.year}) ha sido vendido.`,
              icon: '/favicon.ico',
            });
            setTimeout(() => notification.close(), 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Limpiar el set cuando se desmonta
      notifiedVehicles.current.clear();
    };
  }, [user, isAdmin]);
}