import React, { useState, useRef, useCallback } from 'react';
import './App.css';

function ResumeScanner() {
  const [resumes, setResumes] = useState([]);
  const [requirements, setRequirements] = useState('');
  const [topKResults, setTopKResults] = useState([]);
  const [kValue, setKValue] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedResumeId, setExpandedResumeId] = useState(null);
  const [filters, setFilters] = useState({ minScore: 0, keyword: '' });
  const fileInputRef = useRef(null);

  // File upload handlers with useCallback for better performance
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current.click();
  }, []);

  const processFiles = async (files) => {
    setIsLoading(true);
    const fileArray = Array.from(files);
    
    // Only accept PDF, DOCX, and TXT files
    const validFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles = fileArray.filter(file => 
      validFileTypes.includes(file.type)
    );
    
    if (validFiles.length !== fileArray.length) {
      alert('Only PDF, DOCX, and TXT files are accepted.');
    }
    
    const processedFiles = [];
    
    for (const file of validFiles) {
      try {
        const text = await readFileAsText(file);
        
        processedFiles.push({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          content: text,
          uploadDate: new Date()
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    setResumes(prev => [...prev, ...processedFiles]);
    setIsLoading(false);
  };

  const readFileAsText = (file) => {
    return new Promise((resolve) => {
      // Simulated content based on file name to make each resume unique
      const firstName = ['John', 'Jane', 'Alex', 'Sarah', 'Michael', 'Emily'][Math.floor(Math.random() * 6)];
      const lastName = file.name.split('.')[0];
      const yearsExp = Math.floor(Math.random() * 10) + 1;
      const skills = [
        'JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'Python', 'Data Analysis', 
        'SQL', 'TypeScript', 'AWS', 'Docker', 'CI/CD', 'Agile', 'Scrum', 'Git'
      ];
      
      // Randomly select 5-8 skills
      const selectedSkills = [];
      const skillCount = Math.floor(Math.random() * 4) + 5;
      
      while (selectedSkills.length < skillCount) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        if (!selectedSkills.includes(skill)) {
          selectedSkills.push(skill);
        }
      }
      
      setTimeout(() => {
        resolve(`Resume for ${firstName} ${lastName}. 
        Skills: ${selectedSkills.join(', ')}.
        Experience: ${yearsExp} years as Software Developer, ${Math.floor(yearsExp/2)} years Project Management.
        Education: ${Math.random() > 0.3 ? "Master's" : "Bachelor's"} degree in Computer Science.
        Additional Keywords: agile methodology, team leadership, problem-solving, communication, ${Math.random() > 0.5 ? 'backend development' : 'frontend development'}.`);
      }, 300);
    });
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle requirements changes
  const handleRequirementsChange = useCallback((e) => {
    setRequirements(e.target.value);
  }, []);

  // Handle K value changes
  const handleKValueChange = useCallback((e) => {
    setKValue(parseInt(e.target.value));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name === 'minScore' ? parseInt(value) : value
    }));
  }, []);

  // Reset all data
  const handleReset = useCallback(() => {
    setResumes([]);
    setRequirements('');
    setTopKResults([]);
    setFilters({ minScore: 0, keyword: '' });
  }, []);

  // Remove a single resume
  const handleRemoveResume = useCallback((id) => {
    setResumes(prev => prev.filter(resume => resume.id !== id));
    setTopKResults(prev => prev.filter(result => result.id !== id));
  }, []);

  // Toggle expanded resume
  const toggleExpandResume = useCallback((id) => {
    setExpandedResumeId(expandedResumeId === id ? null : id);
  }, [expandedResumeId]);

  // Analyze resumes and find matches with improved algorithm
  const analyzeResumes = useCallback(() => {
    if (resumes.length === 0 || !requirements.trim()) {
      alert('Please upload resumes and enter job requirements first.');
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Extract key phrases from requirements
      const requirementPhrases = extractKeyPhrases(requirements);
      
      const analyzedResults = resumes.map(resume => {
        // Calculate match score with improved algorithm
        const { matchScore, matchDetails } = calculateDetailedMatchScore(resume.content, requirements, requirementPhrases);
        
        return {
          id: resume.id,
          name: resume.name,
          matchScore,
          content: resume.content,
          keyMatches: matchDetails.matches.slice(0, 10),
          matchBreakdown: matchDetails
        };
      });
      
      // Sort by match score and take top K
      const sortedResults = analyzedResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, kValue);
      
      setTopKResults(sortedResults);
      setIsAnalyzing(false);
    }, 1500);
  }, [resumes, requirements, kValue]);

  // Extract key phrases from text
  const extractKeyPhrases = (text) => {
    if (!text) return [];
    
    // Split by common delimiters and filter out short words
    const phrases = text
      .split(/[,;.]/)
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 5);
      
    // Extract technical skills - simplified NLP simulation
    const technicalTerms = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*|[A-Z]{2,}(?:\+\+)?|[a-z]+(?:\.[a-z]+)+)\b/g) || [];
    
    // Extract years of experience requirements
    const expRequirements = text.match(/\d+\+?\s+years?(?:\s+of\s+experience)?(?:\s+(?:in|with)\s+[^,.;]+)?/g) || [];
    
    return [...new Set([...phrases, ...technicalTerms, ...expRequirements])];
  };

  // Advanced match score calculation
  const calculateDetailedMatchScore = (resumeText, jobRequirements, keyPhrases) => {
    if (!resumeText || !jobRequirements) {
      return { matchScore: 0, matchDetails: { matches: [], categories: {} } };
    }
    
    const resumeLower = resumeText.toLowerCase();
    const requirementsLower = jobRequirements.toLowerCase();
    
    // Extract individual words for basic matching
    const requirementsWords = requirementsLower.split(/\W+/).filter(word => word.length > 3);
    const uniqueRequirementWords = [...new Set(requirementsWords)];
    
    // Track matched terms and their context
    const matches = [];
    const categories = {
      skills: { score: 0, max: 0 },
      experience: { score: 0, max: 0 },
      education: { score: 0, max: 0 },
      softSkills: { score: 0, max: 0 }
    };
    
    // Check for skill matches
    const skillsRegex = /(?:proficient|experience|skilled)\s+(?:in|with)?\s+([^,.;]+)/gi;
    let skillMatch;
    while ((skillMatch = skillsRegex.exec(requirementsLower)) !== null) {
      categories.skills.max += 1;
      if (resumeLower.includes(skillMatch[1].trim())) {
        categories.skills.score += 1;
        matches.push(skillMatch[1].trim());
      }
    }
    
    // Check for experience matches
    const expRegex = /(\d+)\+?\s+years?(?:\s+of\s+experience)?(?:\s+(?:in|with)\s+([^,.;]+))?/gi;
    let expMatch;
    while ((expMatch = expRegex.exec(requirementsLower)) !== null) {
      categories.experience.max += 1;
      const yearsRequired = parseInt(expMatch[1]);
      const expArea = expMatch[2] || '';
      
      // Check if resume mentions similar experience
      const resumeExpMatch = resumeLower.match(new RegExp(`(\\d+)\\+?\\s+years?[^,.;]*${expArea}`, 'i'));
      if (resumeExpMatch) {
        const yearsInResume = parseInt(resumeExpMatch[1]);
        if (yearsInResume >= yearsRequired) {
          categories.experience.score += 1;
          matches.push(`${yearsInResume}+ years ${expArea}`);
        }
      }
    }
    
    // Check for education matches
    const eduRegex = /(?:degree|bachelor|master|phd|doctorate|bs|ms|ba|ma)\s+(?:in|of)?\s+([^,.;]+)/gi;
    let eduMatch;
    while ((eduMatch = eduRegex.exec(requirementsLower)) !== null) {
      categories.education.max += 1;
      if (resumeLower.includes(eduMatch[0].trim())) {
        categories.education.score += 1;
        matches.push(eduMatch[0].trim());
      }
    }
    
    // Check for soft skills
    const softSkills = ['communication', 'teamwork', 'leadership', 'problem-solving', 'critical thinking', 'agile', 'scrum'];
    softSkills.forEach(skill => {
      if (requirementsLower.includes(skill)) {
        categories.softSkills.max += 1;
        if (resumeLower.includes(skill)) {
          categories.softSkills.score += 1;
          matches.push(skill);
        }
      }
    });
    
    // Word-level matching for remaining terms
    uniqueRequirementWords.forEach(word => {
      if (!matches.some(match => match.includes(word)) && resumeLower.includes(word)) {
        matches.push(word);
      }
    });
    
    // Calculate key phrase matches
    keyPhrases.forEach(phrase => {
      const phraseLower = phrase.toLowerCase().trim();
      if (phraseLower.length > 0 && resumeLower.includes(phraseLower)) {
        matches.push(phrase.trim());
      }
    });
    
    // Calculate overall match percentage
    let totalScore = 0;
    let totalMax = 0;
    
    Object.values(categories).forEach(category => {
      if (category.max > 0) {
        totalScore += category.score;
        totalMax += category.max;
      }
    });
    
    // Add weight for additional word matches
    const additionalMatches = matches.length - totalScore;
    if (additionalMatches > 0) {
      totalScore += additionalMatches * 0.5;
      totalMax += additionalMatches * 0.5;
    }
    
    // Ensure we have at least some points possible
    if (totalMax === 0) {
      totalMax = uniqueRequirementWords.length;
      totalScore = matches.length;
    }
    
    const matchScore = Math.min(100, Math.round((totalScore / totalMax) * 100));
    
    return { 
      matchScore, 
      matchDetails: { 
        matches: [...new Set(matches)], 
        categories 
      }
    };
  };

  // Filter displayed results
  const filteredResults = topKResults.filter(result => 
    result.matchScore >= filters.minScore && 
    (filters.keyword === '' || 
      result.content.toLowerCase().includes(filters.keyword.toLowerCase()) ||
      result.keyMatches.some(match => match.toLowerCase().includes(filters.keyword.toLowerCase())))
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>ATS Resume Scanner</h1>
        <p>Upload resumes, enter job requirements, and find the most relevant candidates</p>
      </header>

      <div className="app-container">
        {/* File Upload Section */}
        <div className="upload-section">
          <h2>Upload Resumes</h2>
          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${isLoading ? 'loading' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="upload-content">
              {isLoading ? (
                <div className="loader">Processing files...</div>
              ) : (
                <>
                  <i className="upload-icon">📄</i>
                  <p>Drag & drop resumes here, or click to select files</p>
                  <span className="file-format-info">Accepted formats: PDF, DOCX, TXT</span>
                  <button 
                    type="button" 
                    className="select-files-button" 
                    onClick={handleButtonClick}
                  >
                    Select Files
                  </button>
                </>
              )}
            </div>
          </div>

          {resumes.length > 0 && (
            <>
              <div className="uploaded-files-list">
                <h3>Uploaded Resumes ({resumes.length})</h3>
                <ul>
                  {resumes.map(file => (
                    <li key={file.id} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <button 
                        className="remove-file-button" 
                        onClick={() => handleRemoveResume(file.id)}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="resume-count">
                <button className="reset-button" onClick={handleReset}>
                  Reset All
                </button>
              </div>
            </>
          )}
        </div>

        {/* Requirements Section */}
        <div className="requirements-section">
          <h2>Job Requirements</h2>
          <div className="requirements-input-area">
            <textarea
              value={requirements}
              onChange={handleRequirementsChange}
              placeholder="Enter job requirements here... (e.g., 'Looking for a full-stack developer with 3+ years of experience in React and Node.js, proficient in database design, with strong problem-solving skills and ability to work in an agile environment.')"
              rows={8}
            />
          </div>
          <div className="analysis-controls">
            <div className="k-value-selector">
              <label htmlFor="k-value">Show top</label>
              <select
                id="k-value"
                value={kValue}
                onChange={handleKValueChange}
              >
                {[1, 2, 3, 5, 10, 15, 20].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <span>matches</span>
            </div>
            <button 
              className="analyze-button" 
              onClick={analyzeResumes}
              disabled={isLoading || isAnalyzing || resumes.length === 0 || !requirements.trim()}
            >
              {isAnalyzing ? 'Analyzing...' : 'Find Top Matches'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {topKResults.length > 0 && (
          <div className="results-section">
            <h2>Top Matching Resumes</h2>
            
            <div className="results-filters">
              <div className="filter-group">
                <label htmlFor="minScore">Minimum Score:</label>
                <input
                  type="range"
                  id="minScore"
                  name="minScore"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={handleFilterChange}
                />
                <span>{filters.minScore}%</span>
              </div>
              <div className="filter-group">
                <label htmlFor="keyword">Filter by keyword:</label>
                <input
                  type="text"
                  id="keyword"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="Enter keyword..."
                />
              </div>
              <div className="results-count">
                Showing {filteredResults.length} of {topKResults.length} results
              </div>
            </div>
            
            <div className="results-list">
              {filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <div 
                    key={result.id} 
                    className={`result-item ${expandedResumeId === result.id ? 'expanded' : ''}`}
                  >
                    <div className="result-header" onClick={() => toggleExpandResume(result.id)}>
                      <div className="result-rank">{index + 1}</div>
                      <div className="result-name">{result.name}</div>
                      <div className="result-score">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${result.matchScore}%`,
                              backgroundColor: result.matchScore > 80 ? '#2ecc71' : 
                                              result.matchScore > 60 ? '#3498db' : 
                                              result.matchScore > 40 ? '#f39c12' : '#e74c3c'
                            }}
                          ></div>
                        </div>
                        <span className="score-text">{result.matchScore}% Match</span>
                      </div>
                      <button className="expand-button">
                        {expandedResumeId === result.id ? '▲' : '▼'}
                      </button>
                    </div>
                    
                    {expandedResumeId === result.id && (
                      <div className="result-details">
                        <div className="key-matches">
                          <h4>Key Matches:</h4>
                          <div className="match-tags">
                            {result.keyMatches.map((match, idx) => (
                              <span key={idx} className="match-tag">{match}</span>
                            ))}
                          </div>
                        </div>
                        <div className="resume-content">
                          <h4>Resume Content:</h4>
                          <p>{result.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">
                  No resumes match the current filters. Try adjusting your filter criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeScanner;