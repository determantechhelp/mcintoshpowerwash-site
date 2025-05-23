document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');

  const res = await fetch('https://mcintoshpowerwash.onrender.com/busy');
  const busyTimes = await res.json();

  const events = busyTimes.map(slot => ({
    start: slot.start,
    end: slot.end,
    display: 'background',
    color: '#ff9999'
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    selectable: true,
    slotMinTime: '09:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    height: 'auto',
    expandRows: true,
    weekends: true,
    dayHeaderFormat: { weekday: 'short' }, // Optional: "Mon", "Tue", etc.
    events,
    select: function(info) {
      document.getElementById('booking-form').style.display = 'block';
      document.getElementById('selected-date').value = info.startStr;
    }
  });
  
  

  calendar.render();

  document.getElementById('appointmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      date: document.getElementById('selected-date').value,
      service: document.getElementById('service').value,
      notes: document.getElementById('questions').value
    };

    const start = formData.date;
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const response = await fetch('https://mcintoshpowerwash.onrender.com/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `Appointment: ${formData.name}`,
        description: `Service: ${formData.service}\nEmail: ${formData.email}\nNotes: ${formData.notes}`,
        start,
        end
      })
    });

    const message = await response.text();
    alert(message);
    document.getElementById('booking-form').style.display = 'none';
  });
});
