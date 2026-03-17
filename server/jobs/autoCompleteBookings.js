// jobs/autoCompleteBookings.js
const cron = require('node-cron');
const moment = require('moment-timezone');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

const IST = 'Asia/Kolkata';

/**
 * Har 5 minute mein run hoga.
 * Jo bookings 'confirmed' hain aur unka last slot end ho gaya ho,
 * unhe automatically 'completed' mark kar dega.
 */
const autoCompleteBookings = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const nowIST = moment.tz(IST);

      // Sirf aaj aur pehle ki confirmed bookings lo
      const bookings = await Booking.find({
        status: 'confirmed',
        date: { $lte: moment.tz(IST).endOf('day').toDate() }
      });

      const toComplete = bookings.filter(booking => {
        // Last slot lo (end time sabse late wala)
        const lastSlot = booking.timeSlots?.[booking.timeSlots.length - 1];
        if (!lastSlot?.end) return false;

        // Booking date + last slot end time combine karo
        const [endHour, endMin] = lastSlot.end.split(':').map(Number);
        const slotEndTime = moment.tz(booking.date, IST)
          .hour(endHour)
          .minute(endMin)
          .second(0);

        // Agar slot end time abhi se pehle hai → complete karo
        return slotEndTime.isBefore(nowIST);
      });

      if (toComplete.length === 0) return;

      const ids = toComplete.map(b => b._id);
      await Booking.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'completed' } }
      );

      logger.info(`✅ Auto-completed ${toComplete.length} booking(s): ${toComplete.map(b => b.bookingId).join(', ')}`);

    } catch (err) {
      logger.error(`Auto-complete cron error: ${err.message}`);
    }
  });

  logger.info('🕐 Auto-complete bookings cron job started (every 5 mins)');
};

module.exports = autoCompleteBookings;