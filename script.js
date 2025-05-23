document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const busyRes = await fetch('https://mcintoshpowerwash.onrender.com/busy');
  const busyData = await busyRes.json();

  const busyRanges = busyData.map(range => ({
    start: range.start,
    end: range.end,
    display: 'background',
    color: '#ff9999'
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    events: busyRanges,
    select: function (info) {
      document.getElementById('date').value = info.startStr;
    }
  });

  calendar.render();

  document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      service: document.getElementById('service').value,
      notes: document.getElementById('questions').value
    };

    const start = `${formData.date}T${formData.time}`;
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const res = await fetch('https://mcintoshpowerwash.onrender.com/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `Appointment: ${formData.name}`,
        description: `Service: ${formData.service}\nEmail: ${formData.email}\nNotes: ${formData.notes}`,
        start,
        end
      })
    });

    const text = await res.text();
    alert(text);
  });
});
