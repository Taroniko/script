import React, { useState, useEffect } from 'react';

// Main App component
const App = () => {
  // State for the user's input prompt
  const [prompt, setPrompt] = useState('');
  // State for the generated text content
  const [generatedContent, setGeneratedContent] = useState('');
  // State for the generated image
  const [generatedImage, setGeneratedImage] = useState(null);
  // State to track if content is being generated
  const [isLoading, setIsLoading] = useState(false);
  // State to track if image is being generated
  const [isImageLoading, setIsImageLoading] = useState(false);
  // State to track if content is being refined
  const [isRefining, setIsRefining] = useState(false);
  // State for the refinement prompt
  const [refinementPrompt, setRefinementPrompt] = useState('');
  // State for the selected content type from the dropdown, now defaulting to 'Social Media Post'
  const [contentType, setContentType] = useState('Social Media Post');
  // State for the selected content length
  const [length, setLength] = useState('Medium');
  // States for contact information, loaded from local storage
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  // State for alert message modal
  const [alertMessage, setAlertMessage] = useState(null);

  // Use useEffect to load saved contact info from localStorage on component mount
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('phone');
      const savedEmail = localStorage.getItem('email');
      const savedAddress = localStorage.getItem('address');
      if (savedPhone) setPhone(savedPhone);
      if (savedEmail) setEmail(savedEmail);
      if (savedAddress) setAddress(savedAddress);
    } catch (e) {
      console.error("Failed to load from local storage:", e);
    }
  }, []);

  // Use useEffect to save contact info to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('phone', phone);
      localStorage.setItem('email', email);
      localStorage.setItem('address', address);
    } catch (e) {
      console.error("Failed to save to local storage:", e);
    }
  }, [phone, email, address]);

  // Handle API call for content generation
  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setAlertMessage('Please enter a prompt to generate content.');
      return;
    }

    setIsLoading(true);
    setGeneratedContent('');
    setGeneratedImage(null);

    // Construct the full prompt including length, type, contact info, and hashtag request.
    // The prompt is explicitly for Burmese content.
    let fullPrompt = `Generate a high-quality ${length} length, ${contentType} in Burmese based on the following topic:\n\n"${prompt}"\n\n`;

    if (length === 'Long') {
      fullPrompt += `The content should be very detailed, comprehensive, and long-form. It must include relevant SEO keywords and a strong Call to Action (CTA).`;
    }

    if (phone || email || address) {
      fullPrompt += `\nPlease incorporate the following contact information naturally into the content:\n`;
      if (phone) fullPrompt += `Phone Number: ${phone}\n`;
      if (email) fullPrompt += `Email: ${email}\n`;
      if (address) fullPrompt += `Address: ${address}\n`;
    }

    fullPrompt += `\nProvide only the content itself, in plain text without any Markdown formatting like bold (**), italics (*), or headings (#). After the content, provide a maximum of 8 relevant hashtags, with 3 hashtags per line. The output should be ready to be used directly.`;

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    try {
      let response;
      let retries = 0;
      const maxRetries = 5;
      const initialDelay = 1000;

      while (retries < maxRetries) {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          break;
        }

        retries++;
        const delay = initialDelay * Math.pow(2, retries);
        await new Promise(res => setTimeout(res, delay));
      }

      if (!response || !response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content was generated. Please try again with a different prompt.';
      setGeneratedContent(text);
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('An error occurred. Please check the console for details or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle API call for image generation
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setAlertMessage('Please enter a prompt to generate an image.');
      return;
    }

    setIsImageLoading(true);
    setGeneratedImage(null);
    setGeneratedContent('');

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const payload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1 } };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;

      if (base64Data) {
        setGeneratedImage(`data:image/png;base64,${base64Data}`);
      } else {
        setGeneratedImage('placeholder');
        console.error('Image generation failed:', result);
        setAlertMessage('Image generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setGeneratedImage('placeholder');
      setAlertMessage('An error occurred during image generation. Please try again.');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Handle API call for content refinement
  const handleRefineContent = async () => {
    if (!generatedContent.trim() || !refinementPrompt.trim()) {
      setAlertMessage('Please generate content first and enter a refinement prompt.');
      return;
    }

    setIsRefining(true);

    const fullPrompt = `Refine the following Burmese text based on this instruction: "${refinementPrompt}". The output should be ready to be used directly, in plain text without any formatting.`;

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    try {
      let response;
      let retries = 0;
      const maxRetries = 5;
      const initialDelay = 1000;

      while (retries < maxRetries) {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          break;
        }

        retries++;
        const delay = initialDelay * Math.pow(2, retries);
        await new Promise(res => setTimeout(res, delay));
      }

      if (!response || !response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content was generated. Please try again with a different prompt.';
      setGeneratedContent(text);
    } catch (error) {
      console.error('Error refining content:', error);
      setGeneratedContent('An error occurred. Please check the console for details or try again.');
    } finally {
      setIsRefining(false);
    }
  };

  // Function to copy generated content to clipboard
  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent).then(() => {
      setAlertMessage('Content copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const contentTypes = ['General', 'Blog Post', 'Email', 'Social Media Post', 'Product Description', 'Article'];
  const lengths = ['Short', 'Medium', 'Long'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 font-sans antialiased">
      {/* Custom Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-gray-300 dark:border-gray-600">
            <p className="text-lg text-center text-gray-900 dark:text-gray-100">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className="py-3 px-8 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-colors duration-300"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-10">
        {/* Left column: Input and controls */}
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold text-center text-blue-800 dark:text-blue-400 mb-2 drop-shadow-md">AI Content Pro</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            Create professional content and images effortlessly.
            <br />
            ပရော်ဖက်ရှင်နယ် Content များနှင့် ပုံရိပ်များကို လွယ်ကူစွာ ဖန်တီးပါ။
          </p>
          
          {/* User Input Section */}
          <div className="flex flex-col gap-2">
            <label htmlFor="prompt" className="text-lg font-bold text-gray-800 dark:text-gray-200">Topic or Prompt (ခေါင်းစဉ်):</label>
            <textarea
              id="prompt"
              rows="5"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Benefits of a healthy lifestyle. (ဥပမာ- ကျန်းမာသောဘဝနေထိုင်မှုပုံစံ၏ အကျိုးကျေးဇူးများ။)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 resize-y shadow-inner"
            />
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="contentType" className="text-lg font-bold text-gray-800 dark:text-gray-200">Content Type (စာအမျိုးအစား):</label>
              <select
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 shadow-sm"
              >
                {contentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="length" className="text-lg font-bold text-gray-800 dark:text-gray-200">Content Length (အရှည်):</label>
              <select
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 shadow-sm"
              >
                {lengths.map((len) => (
                  <option key={len} value={len}>{len}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Contact Information Fields */}
          <div className="flex flex-col gap-4 mt-2">
            <label className="text-lg font-bold text-gray-800 dark:text-gray-200">Contact Information (ဆက်သွယ်ရန်):</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone No (ဖုန်းနံပါတ်)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 shadow-sm"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (အီးမေးလ်)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 shadow-sm"
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address (နေရပ်လိပ်စာ)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Generate Buttons Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button
              onClick={handleGenerateContent}
              disabled={isLoading || isImageLoading || isRefining}
              className="py-4 px-6 text-white font-bold text-lg rounded-2xl shadow-lg transition-all duration-300
                         bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
                         disabled:bg-blue-400 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isLoading ? 'Generating Text...' : 'Generate Text (စာသားထုတ်လုပ်ရန်)'}
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={isLoading || isImageLoading || isRefining}
              className="py-4 px-6 text-white font-bold text-lg rounded-2xl shadow-lg transition-all duration-300
                         bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50
                         disabled:bg-purple-400 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isImageLoading ? 'Generating Image...' : '✨ Generate Image (ပုံထုတ်လုပ်ရန်)'}
            </button>
          </div>
        </div>

        {/* Right column: Generated content display section */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">Generated Content (ထုတ်လုပ်ထားသော အကြောင်းအရာ)</h2>
          
          {/* Loading spinners */}
          {(isLoading || isRefining) && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          {isImageLoading && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <svg className="animate-spin h-10 w-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* Generated content display */}
          {!isLoading && !isRefining && !isImageLoading && (generatedContent || generatedImage) && (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-inner border border-gray-300 dark:border-gray-600">
              {generatedImage && (
                <div className="w-full flex justify-center p-4">
                  <img src={generatedImage} alt="Generated from prompt" className="rounded-lg shadow-md max-w-full h-auto" />
                </div>
              )}
              {generatedContent && (
                <div className="w-full whitespace-pre-wrap overflow-y-auto max-h-96 text-gray-800 dark:text-gray-200">
                  {generatedContent}
                </div>
              )}
              {generatedContent && (
                <button
                  onClick={handleCopyContent}
                  className="w-full mt-4 py-3 px-6 text-white font-bold rounded-full shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transform hover:scale-105"
                >
                  Copy Content (ကူးယူရန်)
                </button>
              )}
            </div>
          )}

          {/* Refinement Section */}
          {!isLoading && !isRefining && generatedContent && (
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Refine Generated Text (စာသားပြန်လည်ပြင်ဆင်ရန်)</h3>
              <textarea
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                rows="2"
                placeholder="e.g., Make this more formal and add a call to action. (ဥပမာ- ပိုပြီး ရိုးရှင်းအောင်ပြင်ပြီး Call to Action ထည့်ပါ)"
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 resize-y mb-2 shadow-inner"
              />
              <button
                onClick={handleRefineContent}
                disabled={isRefining}
                className="w-full py-3 px-6 text-white font-bold rounded-full shadow-lg transition-all duration-300
                           bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50
                           disabled:bg-yellow-400 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isRefining ? 'Refining...' : '✨ Refine Content (ပြန်လည်ပြင်ဆင်ရန်)'}
              </button>
            </div>
          )}

          {/* Initial placeholder state */}
          {!isLoading && !isRefining && !isImageLoading && !generatedContent && !generatedImage && (
            <div className="w-full p-6 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-inner text-gray-500 text-center flex items-center justify-center min-h-[200px]">
              <p>Generated content will appear here. (ထုတ်လုပ်ထားသော အကြောင်းအရာများ ဤနေရာတွင် ပေါ်လာပါမည်။)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
