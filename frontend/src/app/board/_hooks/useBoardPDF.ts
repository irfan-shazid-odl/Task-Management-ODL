import { toast } from 'sonner';
import { Task } from '@/lib/types';

export function useBoardPDF(tasks: Task[], boardFilterMode: 'day' | 'month', boardMonth: string, boardDate: string, getDisplayStatus: (t: Task) => string) {
   const loadJsPDF = (): Promise<any> => {
     return new Promise((resolve, reject) => {
       if ((window as any).jspdf) {
         resolve((window as any).jspdf);
         return;
       }
       const script = document.createElement('script');
       script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
       script.async = true;
       script.onload = () => resolve((window as any).jspdf);
       script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
       document.head.appendChild(script);
     });
   };
 
   const generatePDF = async () => {
     if (tasks.length === 0) {
       toast.error('No tasks available for this date.');
       return;
     }
 
     const toastId = toast.loading('Preparing PDF summary...');
 
     try {
       const jspdfModule = await loadJsPDF();
       const { jsPDF } = jspdfModule;
       const doc = new jsPDF();
       
       const dateStr = boardFilterMode === 'month'
         ? new Date(boardMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
         : new Date(boardDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
 
       doc.setFontSize(18);
       doc.setTextColor(79, 70, 229);
       doc.text('Daily Task Summary', 20, 20);
       doc.setFontSize(11);
       doc.setTextColor(100, 116, 139);
       doc.text(`Date: ${dateStr}`, 20, 28);
       doc.line(20, 32, 190, 32);
 
       let yPos = 45;
 
       const grouped = tasks.reduce((acc, t) => {
         const pName = t.project?.name || 'Unassigned Project';
         if (!acc[pName]) acc[pName] = [];
         acc[pName].push(t);
         return acc;
       }, {} as Record<string, Task[]>);
 
       Object.entries(grouped).forEach(([projectName, projectTasks]) => {
         if (yPos > 260) {
           doc.addPage();
           yPos = 20;
         }
 
         doc.setFontSize(13);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(15, 23, 42);
         doc.text(`Project Name : ${projectName}`, 20, yPos);
         yPos += 8;
 
         doc.setFontSize(10);
         doc.setTextColor(100, 116, 139);
         doc.text('Tasks', 25, yPos);
         doc.text('Status', 160, yPos);
         yPos += 2;
         doc.setDrawColor(241, 245, 249);
         doc.line(25, yPos, 185, yPos);
         yPos += 8;
 
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(51, 65, 85);
         projectTasks.forEach((t, i) => {
           if (yPos > 275) {
             doc.addPage();
             yPos = 20;
           }
           
           const taskLine = `${i + 1}. ${t.description}`;
           doc.text(taskLine, 25, yPos);
           doc.text(getDisplayStatus(t) || 'Todo', 160, yPos);
           yPos += 8;
         });
 
         yPos += 10;
       });
 
       doc.save(`Task_Summary_${boardFilterMode === 'month' ? boardMonth : boardDate}.pdf`);
       toast.dismiss(toastId);
       toast.success('PDF generated successfully!');
     } catch (error) {
       console.error('PDF Generation Error:', error);
       toast.dismiss(toastId);
       toast.error('Could not load PDF generator. Check your internet connection.');
     }
   };
 
  return { generatePDF };
}
