document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');
  const loadingOverlay = document.getElementById('loading-overlay');
  const appointmentForm = document.getElementById('appointmentForm'); // Get the appointment form

  if (loadingOverlay) {
    loadingOverlay.style.display = 'block';
  }

  // Calendar and busy times logic (only if calendarEl exists)
  if (calendarEl) {
    try {
      const res = await fetch('https://mcintoshpowerwash.onrender.com/busy');
      const busyTimes = await res.json();

      const busyDays = new Set();
      busyTimes.forEach(slot => {
        const date = new Date(slot.start).toISOString().split('T')[0];
        busyDays.add(date);
      });

      const events = Array.from(busyDays).map(date => ({
        start: date,
        end: date,
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
        dayHeaderFormat: { weekday: 'short' },
        events,
        longPressDelay: 10, // Add this line or adjust the value (e.g., 0 or 50)
        select: function (info) {
          const clickedDate = info.start.toISOString().split('T')[0];
          if (busyDays.has(clickedDate)) {
            alert("❌ This day is fully booked.");
            calendar.unselect();
            return;
          }

          const options = { hour: 'numeric', minute: 'numeric', hour12: true };
          const startTime = info.start.toLocaleTimeString('en-US', options);
          const endTime = info.end.toLocaleTimeString('en-US', options);
          const selectedDateStr = info.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

          const timeDisplayString = `Selected Slot: ${selectedDateStr}, ${startTime} - ${endTime}`;
          const selectedTimeDisplay = document.getElementById('selected-time-display');
          if (selectedTimeDisplay) {
            selectedTimeDisplay.innerHTML = timeDisplayString;
          }

          const bookingForm = document.getElementById('booking-form');
          if (bookingForm) {
            bookingForm.style.display = 'block';
          }
          const selectedDateInput = document.getElementById('selected-date');
          if (selectedDateInput) {
            selectedDateInput.value = info.startStr;
          }
        }
      });

      calendar.render();
    } catch (error) {
      console.error("Error loading calendar or busy times:", error);
      calendarEl.innerHTML = "<p>Could not load appointment calendar. Please try refreshing the page.</p>";
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }
  } else if (loadingOverlay) { // If not on calendar page, still hide overlay if it exists
    loadingOverlay.style.display = 'none';
  }

  // Appointment form submission logic (only if appointmentForm exists)
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', async function (e) {
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
          end,
          email: formData.email,
          name: formData.name,
          service: formData.service
        })
      });

      const message = await response.text();
      alert(message);
      const bookingForm = document.getElementById('booking-form');
      if (bookingForm) {
        bookingForm.style.display = 'none';
      }
    });
  }
});

async function loadGooglePlacesScript() {
  const res = await fetch('https://mcintoshpowerwash.onrender.com/places-api-key');
  const data = await res.json();
  const apiKey = data.key;

  // Create a script tag and define the callback function
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`; // Notice the 'callback=initMap'
  script.async = true;
  script.defer = true; // Add defer for better performance

  // Define the global callback function
  window.initMap = function () {
    const locationInput = document.getElementById('location');
    if (locationInput && window.google && window.google.maps && window.google.maps.places) {
      new google.maps.places.Autocomplete(locationInput, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });
    }
    // Clean up the global callback to avoid polluting the global scope unnecessarily
    delete window.initMap;
  };

  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function () {
  loadGooglePlacesScript();
  const form = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');

  // Fetch and display existing reviews
  async function loadReviews() {
    try {
      const res = await fetch('https://mcintoshpowerwash.onrender.com/reviews'); // Updated URL
      const reviews = await res.json();
      reviewsList.innerHTML = '';
      reviews.reverse().forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `<strong>${review.name}</strong><br><span>${review.text}</span><hr>`;
        reviewsList.appendChild(reviewDiv);
      });
    } catch (err) {
      reviewsList.innerHTML = '<em>Unable to load reviews.</em>';
    }
  }

  if (form && reviewsList) {
    loadReviews();
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('reviewer').value.trim();
      const text = document.getElementById('review-text').value.trim();
      if (name && text) {
        try {
          const res = await fetch('https://mcintoshpowerwash.onrender.com/reviews', { // Updated URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, text })
          });
          if (res.ok) {
            form.reset();
            loadReviews();
          } else {
            alert('Failed to submit review.');
          }
        } catch (err) {
          alert('Error submitting review.');
        }
      }
    });
  }
});
