export const usePushNotifications = () => {
  return {
    permission: 'denied' as 'granted' | 'denied' | 'default',
    register: async () => {
      console.log('Push notifications not yet configured');
    },
  };
};
