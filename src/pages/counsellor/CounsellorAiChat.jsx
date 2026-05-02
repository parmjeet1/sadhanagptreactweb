import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { postRequest } from '../../services/api';

const callAI = async (messages) => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

  // Prefix system instruction to the first message if needed implicitly
  const contents = messages.map(m => ({
    role: m.role === 'model' || m.role === 'ai' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || m.text }]
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "AI request failed");
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Empty response from AI");
  }

  return data.candidates[0].content.parts[0].text;
};

// Premium Markdown Renderer
const MarkdownMessage = ({ text }) => {
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-[#1a73e8]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderLine = (line, idx) => {
    const cleanLine = line.trim();
    if (!cleanLine) return <div key={idx} className="h-3" />;

    if (line.startsWith('## ')) {
      const title = line.replace('## ', '');
      return (
        <div key={idx} className="mt-8 mb-4 flex items-center gap-3 text-[#1a73e8]">
          <div className="w-1.5 h-6 rounded-full bg-[#1a73e8]" />
          <h2 className="text-[17px] font-black uppercase tracking-tight">{title}</h2>
        </div>
      );
    }

    if (cleanLine.startsWith('**') && cleanLine.endsWith(':**')) {
      const title = cleanLine.replace(/\*\*|:/g, '');
      return (
        <div key={idx} className="mt-5 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit bg-gray-100 text-gray-700">
          <span className="text-[14px]">📝</span>
          <span className="text-[12px] font-black uppercase tracking-widest">{title}</span>
        </div>
      );
    }

    if (line.match(/^[\*\-]\s+/)) {
      const content = line.replace(/^[\*\-]\s+/, '');
      return (
        <div key={idx} className="flex items-start gap-3 my-2.5 pl-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-[8px] shrink-0" />
          <p className="text-[14.5px] leading-[1.6] text-[#334155] font-bold">
            {renderInline(content)}
          </p>
        </div>
      );
    }

    if (line.match(/^\d+\.\s+/)) {
      const num = line.match(/^(\d+)\./)[1];
      const content = line.replace(/^\d+\.\s+/, '');
      return (
        <div key={idx} className="bg-white border border-gray-100 rounded-[20px] p-4 my-3 shadow-sm flex items-start gap-3">
          <span className="w-6 h-6 rounded-lg bg-[#1a73e8] text-white text-[11px] font-black flex items-center justify-center shrink-0">
            {num}
          </span>
          <p className="text-[14px] leading-relaxed text-[#334155] font-bold">
            {renderInline(content)}
          </p>
        </div>
      );
    }

    return <p key={idx} className="text-[14.5px] leading-[1.7] text-[#475569] my-1.5 font-bold">{renderInline(line)}</p>;
  };

  const parseRow = (line) => line.split('|').map(cell => cell.trim()).filter((_, i, arr) => !(i === 0 || i === arr.length - 1));

  const exportToCSV = (tableData, index) => {
    if (!tableData || tableData.length < 2) return;
    const csvContent = tableData
      .filter((_, i) => i !== 1) // Remove markdown table separator row
      .map(row => {
        const cells = parseRow(row);
        // Wrap in quotes and escape internal quotes for CSV safety
        return cells.map(c => `"${c.replace(/"/g, '""')}"`).join(",");
      })
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_report_${index}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (tableData, blockIdx) => {
    if (tableData.length < 2) return null;
    const headRow = parseRow(tableData[0]);
    // Data[1] is the separator (e.g. |---|)
    const bodyRows = tableData.slice(2).map(parseRow);

    return (
      <div key={`table-${blockIdx}`} className="overflow-x-auto w-full my-6 rounded-xl border border-gray-200 hide-scrollbar shadow-sm">
        <div className="flex justify-end bg-gray-50 p-2 border-b border-gray-200">
          <button onClick={() => exportToCSV(tableData, blockIdx)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download CSV
          </button>
        </div>
        <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap min-w-full">
          <thead className="bg-[#f8fafc] text-gray-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              {headRow.map((h, i) => <th key={i} className="px-4 py-3.5 border-b border-gray-200 font-extrabold">{renderInline(h)}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bodyRows.map((row, i) => (
              <tr key={i} className="hover:bg-[#f8fafc]/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3.5 text-[#334155] whitespace-normal min-w-[120px] align-top font-medium leading-relaxed">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Pre-processing
  const rawLines = text.split('\n').filter(l => !l.trim().startsWith('```'));
  const blocks = [];
  let inTable = false;
  let tableBuffer = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (line.startsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
    } else if (line === '') {
      if (inTable) {
        let j = i + 1;
        while (j < rawLines.length && rawLines[j].trim() === '') j++;
        if (j < rawLines.length && rawLines[j].trim().startsWith('|')) {
          continue; // Skip empty line inside a table
        } else {
          blocks.push({ type: 'table', data: tableBuffer });
          tableBuffer = [];
          inTable = false;
          blocks.push({ type: 'line', text: rawLines[i] });
        }
      } else {
        blocks.push({ type: 'line', text: rawLines[i] });
      }
    } else {
      if (inTable) {
        blocks.push({ type: 'table', data: tableBuffer });
        tableBuffer = [];
        inTable = false;
      }
      blocks.push({ type: 'line', text: rawLines[i] });
    }
  }
  if (inTable) {
    blocks.push({ type: 'table', data: tableBuffer });
  }

  const downloadAllCSV = () => {
    const tableBlocks = blocks.filter(b => b.type === 'table');
    if (tableBlocks.length === 0) return;

    // Assume first table defines headers
    const headRow = parseRow(tableBlocks[0].data[0]);
    let csvLines = [headRow.map(c => `"${c.replace(/"/g, '""')}"`).join(",")];

    tableBlocks.forEach(tb => {
      const bodyRows = tb.data.slice(2).map(parseRow);
      bodyRows.forEach(row => {
        csvLines.push(row.map(c => `"${c.replace(/"/g, '""')}"`).join(","));
      });
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `all_students_full_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {blocks.some(b => b.type === 'table') && (
        <div className="flex justify-end mb-4">
          <button onClick={downloadAllCSV} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-[#1a73e8] rounded-xl shadow-md hover:bg-[#1557b0] transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Full Report (CSV)
          </button>
        </div>
      )}
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return renderTable(block.data, idx);
        }
        return renderLine(block.text, idx);
      })}
    </div>
  );
};
const buildSystemPrompt = (jsonData) => `You are an empathetic, encouraging, and analytical ISKCON sadhana counselor. Your goal is to review the daily spiritual practices (sadhana) of student practitioners based on the provided JSON data.

The Standard Ideals
Evaluate the students' practices against the ideal targets set by them in the input json.

Analysis Instructions
1. Parse the provided JSON data. For each student in the \`students_report\` array, generate a dedicated section.
2. Empty Data: If a student has an empty \`daily_report\`, state: "No data logged for this period. Please start tracking your daily sadhana!" and skip their table.
3. Parsing the Table: For students with data, extract the values for Chanting, Reading, Hearing, Wake Up, Sleep, Study, and Day Rest based on the \`activity_name\` and \`count\` fields. If an activity is missing for a specific date, you MUST output "None" in that specific table cell. Do not leave cells blank.
4. Holistic Assessment:
   - Strong Point: Identify a positive trend across the entire reporting period (e.g., "Highly consistent chanting").
   - Weak Point: Identify a recurring issue or missing element across the period (e.g., "Inconsistent wake-up times").
   - Suggestion: Provide brief, practical, and encouraging advice to address the weak point, balancing sadhana with student life.

Output Format
You should generate the output in the form of a table where on one side is the name of the devotee, and on the other are the "centre_name" & "label_name" along with the sadhana elements I mentioned above (chanting, reading, hearing, etc.) which defaults to "None," along with the following fields in the table: 
- a weak point in their sadhana 
- a strong point in their sadhana 
- a suggestion for them
The sadhana elements I mentioned for a given devotee should be an average of all the dates mentioned, regardless of whether the sadhana is mentioned for that date or is None. On dates where the activities are empty, mention those dates in the table along with the Name. In case there are larger deviations from the average, they should be mentioned in the same cell as the highest and lowest. 
The records should be sorted based the "center_name" first and then "label_name". There should be no text outside of the single table output generated and the output requirements mentioned above.
When triggered to generate the report, generate a Markdown code for the entire report.

Here is the JSON dataset:
${JSON.stringify(jsonData)}
`;

const CounsellorAiChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      category: 'System',
      text: 'Welcome to the Counsellor AI Assistant. How can I help you analyze your mentees today?',
      icon: 'bot'
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const runAnalysis = async () => {
      const { student_ids, date_from, date_to, studentsData, reports, fromReport } = location.state || {};
      
      if (fromReport && reports) {
        setAnalyticsData(reports);
        setIsAnalyzing(true);
        try {
          const systemContext = buildSystemPrompt(reports);
          
          const result = await callAI([{text: systemContext, role: 'user'}]);
          setMessages([
            { role: 'user', category: 'You', text: 'Generate Bulk AI Report' },
            { role: 'ai', category: 'AI Analysis', text: result, icon: 'bot' }
          ]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'ai', category: 'Error', text: `AI analysis failed: ${ err.message } `, icon: 'bot' }]);
        }
        setIsAnalyzing(false);
        return;
      }

      if (student_ids && studentsData) {
        setIsAnalyzing(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            category: 'Status',
            text: `Gathering and analyzing activity data for ${ studentsData.length } students from the database... Please wait.`,
            icon: 'bot'
          }
        ]);

        const payload = {
          user_id: userDetails.user_id,
          student_ids,
          date_from,
          date_to
        };

        postRequest('/bulk-ai-report', payload, async (response) => {
          if (response.data?.status === 1) {
            const reportData = response.data.data;
            setAnalyticsData(reportData);

            try {
              const systemContext = buildSystemPrompt(reportData);
              
              const result = await callAI([{text: systemContext, role: 'user'}]);

              setMessages([
                { role: 'user', category: 'You', text: 'Generate Bulk AI Report' },
                { role: 'ai', category: 'AI Analysis', text: result, icon: 'bot' }
              ]);
            } catch (err) {
              setMessages(prev => [
                ...prev,
                { role: 'ai', category: 'Error', text: `AI analysis failed: ${ err.message } `, icon: 'bot' }
              ]);
            }
          } else {
             setMessages(prev => [
                ...prev,
                { role: 'ai', category: 'Error', text: `Failed to fetch data from database: ${ response.data?.message || 'Server Error' } `, icon: 'bot' }
             ]);
          }
          setIsAnalyzing(false);
        });
      }
    };

    runAnalysis();
    // eslint-disable-next-line
  }, [location.state, userDetails.user_id]);

  const handleSendMessage = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userMsg = {
      role: 'user',
      category: 'You',
      text: input,
      icon: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    try {
      const historyContext = messages.map(m => ({ text: m.text, role: m.role }));
      
      let finalMessages = [];
      if (analyticsData) {
         finalMessages = [
           {role: 'user', text: `Context Database: ${ JSON.stringify(analyticsData) } `},
           ...historyContext,
           {role: 'user', text: input}
         ];
      } else {
         finalMessages = [...historyContext, {role: 'user', text: input}];
      }

      const result = await callAI(finalMessages);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          category: 'AI Assistant',
          text: result,
          icon: 'bot'
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'ai', text: "Sorry, I ran into an error connecting to the AI."}]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto transition-all duration-300">
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 py-4 max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-[18px] font-black text-[#0f172a] leading-none tracking-tight">Mentee Analysis</h1>
              <p className="text-[12px] font-bold text-[#1a73e8] mt-1">AI Assistant</p>
            </div>
          </div>
        </header>

        <div className="pt-24 px-6">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 px-1">AI Interaction</h3>
          
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#1a73e8] shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                </div>
                <div className="bg-white rounded-[24px] rounded-tl-none p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex-1 overflow-hidden">
                    {msg.role === 'ai' && msg.category !== 'Status' && msg.category !== 'Error' && msg.category !== 'System' ? (
                       <MarkdownMessage text={msg.text} />
                    ) : (
                       <div className="text-[14.5px] leading-relaxed text-[#1e293b] whitespace-pre-wrap font-bold ai-content">
                         {msg.text}
                       </div>
                    )}
                </div>
              </motion.div>
            ))}

            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-1 mt-4"
              >
                <div className="flex gap-1">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                </div>
                <span className="text-[12px] font-bold text-[#1a73e8]">AI is thinking...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-28 left-0 right-0 px-6 max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto z-40 transition-all duration-300">
          <div className="relative">
            <input 
              type="text"
              placeholder="Ask AI about mentees' progress..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-white border-2 border-gray-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] shadow-xl shadow-gray-200/50 outline-none focus:border-[#1a73e8]/20 transition-all placeholder:text-gray-300"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isAnalyzing}
              className={`absolute right - 2 top - 1 / 2 - translate - y - 1 / 2 w - 10 h - 10 bg - transparent flex items - center justify - center transition - all ${ isAnalyzing ? 'text-gray-300' : 'text-[#1a73e8] active:scale-90' } `}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>

      </div>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorAiChat;
