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
  if (absolute >= 85.49) return "A/A+";
  if (absolute >= 81.49) return "A-";
  if (absolute >= 77.49) return "B+";
  if (absolute >= 73.49) return "B";
  if (absolute >= 69.49) return "B-";
  if (absolute >= 65.49) return "C+";
  if (absolute >= 61.49) return "C";
  if (absolute >= 57.49) return "C-";
  if (absolute >= 53.49) return "D+";
  if (absolute >= 49.49) return "D";
  return "F";
}

function calculateSubjectSums() {
  const subjects = [];

  // Iterate through each subject's section on the page
  document.querySelectorAll(".tab-pane").forEach(subjectTab => {
    // const subjectName = subjectTab.querySelector("h5").textContent.split('-')[1].trim();
    // if the length of the split array is 2, then the subject name is in the first element
    // else pick last 2 

    const subjectName = subjectTab.querySelector("h5").textContent.split('-').length === 2 ? subjectTab.querySelector("h5").textContent.split('-')[1].trim() : subjectTab.querySelector("h5").textContent.split('-').slice(-2).join('-').trim();



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
    totalWeightage = Math.min(totalWeightage, 100);

    if (totalWeightage > 0) {
      projectedAbsolute = ((totalObtMarks / totalWeightage) * 100).toFixed(1); // Final percentage
    }

    if(totalAverageMarks > 0){
      projectedAverage = ((totalAverageMarks / totalWeightage) * 100).toFixed(1); // Final percentage
    }

    // Store results for each subject
    subjects.push({
      name: subjectName,
      totalWeightage: totalWeightage.toFixed(1),
      totalObtMarks: totalObtMarks.toFixed(1),
      projectedAbsolute: projectedAbsolute,
      projectedAverage: projectedAverage,
    });
  });

  return subjects;
}
