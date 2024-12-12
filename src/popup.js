document.getElementById("calculate").addEventListener("click", async () => {
  try {
    // Inject script to the current tab to access its DOM
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: calculateSubjectSums,
      },
      (result) => {
        if (result && result[0].result) {
          const subjects = result[0].result;

          // Clear the existing rows before adding new ones
          const tableBody = document.querySelector('table tbody');
          tableBody.innerHTML = '';

          // Create and append rows for each subject
          subjects.forEach(subject => {
            const projectedGrade = getGrade(subject.projectedAbsolute);

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${subject.name}</td>
              <td>${subject.totalWeightage}</td>
              <td>${subject.totalObtMarks}</td>
              <td>${subject.projectedAbsolute}%</td>
              <td>${projectedGrade}</td>
              <td>${subject.projectedAverage}%</td>
            `;
            tableBody.appendChild(row);
          });
        } else {
          console.error("Error calculating sums.");
        }
      }
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
});

// Function to determine projected grade based on absolute value
function getGrade(absolute) {
  if (absolute >= 86) return "A/A+";
  if (absolute >= 82) return "A-";
  if (absolute >= 78) return "B+";
  if (absolute >= 72) return "B";
  if (absolute >= 68) return "B-";
  if (absolute >= 62) return "C+";
  if (absolute >= 58) return "C";
  if (absolute >= 55) return "C-";
  if (absolute >= 50) return "D";
  return "F";
}

function calculateSubjectSums() {
  const subjects = [];

  // Iterate through each subject's section on the page
  document.querySelectorAll(".tab-pane").forEach(subjectTab => {
    const subjectName = subjectTab.querySelector("h5").textContent.split('-')[0].trim();
    const weightageElements = subjectTab.querySelectorAll(".weightage");
    const marksElements = subjectTab.querySelectorAll(".ObtMarks");
    const grandTotalMarks = subjectTab.querySelectorAll(".GrandTotal");
    const avgMarks = subjectTab.querySelectorAll(".AverageMarks");

    let totalWeightage = 0;
    let totalObtMarks = 0;
    let totalAverageMarks = 0;
    let projectedAbsolute = 0;

    weightageElements.forEach((weightageElement, index) => {
      const weightageValue = parseFloat(weightageElement.textContent.trim());
      const marksValue = parseFloat(marksElements[index].textContent.trim());
        const grandTotal = parseFloat(grandTotalMarks[index].textContent.trim());
      const avgMarksValue = parseFloat(avgMarks[index].textContent.trim());
      // Ensure the marks are not '-'
      if (!isNaN(marksValue) && marksElements[index].textContent !== '-') {
        // Calculate ObtMarks based on GrandTotal and Weightage for the current row
        const activityObtMarks = (marksValue / grandTotal) * weightageValue;
        const activityAvgMarks = (avgMarksValue / grandTotal) * weightageValue;

        totalWeightage += weightageValue;
        totalObtMarks += activityObtMarks;
        totalAverageMarks += activityAvgMarks;
      }




    });

    if (totalWeightage > 0) {
      projectedAbsolute = ((totalObtMarks / totalWeightage) * 100).toFixed(2); // Final percentage
    }

    if(totalAverageMarks > 0){
      projectedAverage = ((totalAverageMarks / totalWeightage) * 100).toFixed(2); // Final percentage
    }

    // Store results for each subject
    subjects.push({
      name: subjectName,
      totalWeightage: Math.round(totalWeightage),
      totalObtMarks: Math.round(totalObtMarks),
      projectedAbsolute: Math.round(projectedAbsolute),
      projectedAverage: Math.round(projectedAverage),
    });
  });

  return subjects;
}