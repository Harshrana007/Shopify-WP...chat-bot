import { researchSources } from './researchData.js';

const normalize = (str = '') => String(str).toLowerCase().trim();

// ============================================================================
// INTENT DETECTION - Categorize user messages into distinct types
// ============================================================================

export function detectIntent(text) {
  const normalized = normalize(text);

  // Greeting - simple hello variants
  if (/^(hi|hey|hello|good morning|good evening|greetings|what.s up|yo|howdy)\.?$/.test(normalized)) {
    return { intent: 'GREETING', confidence: 1.0 };
  }

  // Capabilities - what can you do
  if (/^(what can you do|who are you|tell me about yourself|what do you do|what are you|capabilities|features|help)/.test(normalized)) {
    return { intent: 'CAPABILITIES', confidence: 1.0 };
  }

  // Domain boundary - clearly unrelated (CHECK BEFORE RESEARCH_QUERY)
  if (/weather|sports|movie|recipe|code|how do i fix|car trouble|travel|tech support|python|javascript|sql|database|poem|story|game/i.test(normalized)) {
    return { intent: 'DOMAIN_BOUNDARY', confidence: 0.95 };
  }

  // Personalized medical - dosing or treatment for the user
  if (/dose|dosage|personally|individual|treatment plan|prescrib|take.*for|personal recommendation|what should i|what peptide should i take|how much|supplement for me/i.test(normalized) &&
      /\b(i|me|my|age|weight|condition|injury)\b/i.test(normalized)) {
    return { intent: 'PERSONALIZED_MEDICAL', confidence: 0.95 };
  }

  // Comparison - compare two things
  if (/compare|vs\.?|versus|difference between|which is better/i.test(normalized)) {
    return { intent: 'COMPARISON', confidence: 0.9 };
  }

  // Human studies
  if (/human studies|human evidence|human research|human trials|clinical studies|clinical evidence/i.test(normalized)) {
    return { intent: 'HUMAN_STUDIES', confidence: 0.9 };
  }

  // Limitations - what's not known
  if (/limitations|what.*not|what.*lack|why not|insufficient|why is|what.s the problem|criticism/i.test(normalized)) {
    return { intent: 'EVIDENCE_LIMITATIONS', confidence: 0.85 };
  }

  // Peptide research - general research question
  if (/(peptide|peptides|bpc|ghk|glp|thymosin|research|study|evidence|trial|mechanism|literature|protein|bioactive|what does|explain|summarize|discuss)/i.test(normalized) &&
      normalized.length > 5) {
    return { intent: 'RESEARCH_QUERY', confidence: 0.8 };
  }

  // Unclear
  return { intent: 'UNKNOWN', confidence: 0.5 };
}

// ============================================================================
// RESPONSE ROUTER - Main function that routes to the right handler
// ============================================================================

export async function buildResponse(text, topics = []) {
  const { intent } = detectIntent(text);

  switch (intent) {
    case 'GREETING':
      return buildGreetingResponse();
    case 'CAPABILITIES':
      return buildCapabilitiesResponse();
    case 'PERSONALIZED_MEDICAL':
      return buildPersonalizedMedicalResponse(text);
    case 'COMPARISON':
      return buildComparisonResponse(text, topics);
    case 'HUMAN_STUDIES':
      return buildHumanStudiesResponse(text, topics);
    case 'EVIDENCE_LIMITATIONS':
      return buildEvidenceLimitationsResponse(text, topics);
    case 'RESEARCH_QUERY':
      return buildResearchResponse(text, topics);
    case 'DOMAIN_BOUNDARY':
      return buildDomainBoundaryResponse();
    case 'UNKNOWN':
      return buildClarificationResponse();
    default:
      return buildResearchResponse(text, topics);
  }
}

// ============================================================================
// RESPONSE BUILDERS - Each intent type has its own response structure
// ============================================================================

function buildGreetingResponse() {
  return {
    answer: "Hi, I'm the Peptide Research Assistant. I can help you explore published research, compare evidence, find human studies, understand study limitations, and trace answers back to their sources.\n\nWhat would you like to research?",
    whyThisAnswer: 'This is a greeting that introduces the assistant role and invites a research question.',
    evidenceLevel: 'Greeting',
    citations: [],
    confidence: 'n/a',
    responseType: 'greeting',
    hasSufficientEvidence: false,
  };
}

function buildCapabilitiesResponse() {
  return {
    answer: "I can help you with:\n\n• Explore peptide research and find published studies\n• Compare evidence between different peptides\n• Find human clinical studies and distinguish them from preclinical research\n• Summarize research findings and explain what the evidence does and does not establish\n• Understand study limitations and evidence gaps\n• Trace answers back to their sources and review the metadata\n\nI do not provide individualized medical treatment or personal dosing recommendations. I focus on source-backed research education.",
    whyThisAnswer: 'This describes the scope of the research assistant and the boundary around personalized medical guidance.',
    evidenceLevel: 'Capabilities',
    citations: [],
    confidence: 'n/a',
    responseType: 'capabilities',
    hasSufficientEvidence: false,
  };
}

function buildPersonalizedMedicalResponse(text) {
  const sources = getRelevantSources(text).slice(0, 2);

  return {
    answer: "I can help you understand the published research, but I cannot provide an individualized treatment or personal dosing plan.\n\nWhat I can do instead:\n• Summarize the research related to your condition\n• Show you the relevant studies and their findings\n• Explain what protocols were reported in the literature\n• Help you understand evidence strength and limitations\n\nFor treatment decisions and dosing, please consult a qualified healthcare provider who understands your full medical history.",
    whyThisAnswer: 'Personalized medical guidance falls outside the scope of this research assistant. The product is designed for evidence education, not treatment planning.',
    evidenceLevel: 'Safety boundary',
    citations: sources,
    confidence: 'n/a',
    responseType: 'boundary',
    hasSufficientEvidence: false,
  };
}

function buildComparisonResponse(text, topics = []) {
  const normalized = normalize(text);
  const peptideMatches = normalized.match(/(bpc-?157|ghk-?cu|glp-?1|thymosin|tb-?500)/gi) || [];
  const uniquePeptides = [...new Set(peptideMatches.map((p) => p.toLowerCase()))];

  if (uniquePeptides.length < 2) {
    return buildResearchResponse(text, topics);
  }

  const sources = getRelevantSources(text, topics);

  if (sources.length === 0) {
    return {
      answer: `I do not have sufficient research in the library to reliably compare ${uniquePeptides.join(' and ')}. The available sources do not include enough comparative evidence.`,
      whyThisAnswer: 'No relevant comparative sources were found for this comparison.',
      evidenceLevel: 'Insufficient evidence',
      citations: [],
      confidence: 'low',
      responseType: 'comparison',
      hasSufficientEvidence: false,
    };
  }

  return {
    answer: `Comparison: ${uniquePeptides.join(' versus ')}`,
    comparisonItems: uniquePeptides,
    whyThisAnswer: 'This comparison is based on the available research library and distinguishes human evidence from preclinical findings.',
    evidenceLevel: 'Limited/mixed evidence',
    citations: sources.slice(0, 5),
    confidence: 'low',
    responseType: 'comparison',
    hasSufficientEvidence: true,
  };
}

function buildHumanStudiesResponse(text, topics = []) {
  const humanStudies = researchSources.filter((s) =>
    s.studyType === 'Human study' || s.studyType === 'Clinical trial'
  );

  if (humanStudies.length === 0) {
    return {
      answer: "The current research library does not include verified human clinical trials. The available evidence is predominantly preclinical and secondary literature.",
      whyThisAnswer: 'A search for human studies in the library returned no results.',
      evidenceLevel: 'Research availability',
      citations: [],
      confidence: 'n/a',
      responseType: 'human_studies',
      hasSufficientEvidence: false,
    };
  }

  const list = humanStudies.map((s) => `• ${s.title} (${s.year}), ${s.studyType}, Evidence: ${s.evidenceLevel}`).join('\n');

  return {
    answer: `Available human research: The library includes ${humanStudies.length} human or clinical studies.\n\n${list}\n\nThese represent the highest-quality evidence available in the current library.`,
    whyThisAnswer: 'This lists human clinical evidence found in the research library, distinguished from preclinical research.',
    evidenceLevel: 'Human clinical evidence',
    citations: humanStudies.slice(0, 3),
    confidence: 'high',
    responseType: 'human_studies',
    hasSufficientEvidence: true,
  };
}

function buildEvidenceLimitationsResponse(text, topics = []) {
  const sources = getRelevantSources(text, topics);

  if (sources.length === 0) {
    return {
      answer: "The research library does not include sources on that topic, so I cannot describe the limitations of evidence for it.",
      whyThisAnswer: 'No relevant sources were found to assess.',
      evidenceLevel: 'Insufficient evidence',
      citations: [],
      confidence: 'low',
      responseType: 'limitations',
      hasSufficientEvidence: false,
    };
  }

  const limitations = sources.flatMap((s) => s.limitations).slice(0, 3);
  const list = limitations.map((l) => `• ${l}`).join('\n');

  return {
    answer: `Evidence limitations for this topic:\n\n${list}\n\nKey takeaway: research evidence has gaps. Studies often use small samples, short durations, or preclinical models that may not directly predict human outcomes.`,
    whyThisAnswer: 'This summarizes the limitations described in the relevant research sources.',
    evidenceLevel: 'Evidence assessment',
    citations: sources.slice(0, 3),
    confidence: 'medium',
    responseType: 'limitations',
    hasSufficientEvidence: true,
  };
}

function buildResearchResponse(question, topics = []) {
  const normalized = normalize(question);

  if (!normalized) {
    return {
      answer: 'I need a question before I can search the research library.',
      citations: [],
      responseType: 'research',
      hasSufficientEvidence: false,
    };
  }

  const sources = getRelevantSources(question, topics);

  if (sources.length === 0) {
    return {
      answer: "The research library does not include sources that match this query. Try asking about a specific peptide, requesting a comparison, or asking about research types and evidence levels.",
      whyThisAnswer: 'No relevant sources matched the search.',
      evidenceLevel: 'Insufficient evidence',
      citations: [],
      confidence: 'low',
      responseType: 'research',
      hasSufficientEvidence: false,
    };
  }

  const evidenceLevels = sources.map((s) => s.evidenceLevel);
  const hasHumanEvidence = evidenceLevels.some((l) => l.startsWith('Tier 1') || l.startsWith('Tier 2'));
  const hasConflict = sources.some((s) => s.evidenceLevel === 'Tier 5' || s.evidenceLevel === 'Tier 6');

  let answer = `What the research says: The available library includes ${sources.length} relevant source(s) with ${
    hasHumanEvidence ? 'human or formal clinical evidence' : 'preclinical and secondary literature'
  }. This suggests the literature is ${
    hasHumanEvidence ? 'more developed than purely anecdotal evidence' : 'still limited and should be interpreted cautiously'
  }.`;

  if (hasConflict) {
    answer += ' The available literature is mixed. Some records describe promising effects in preclinical or mechanistic settings, while other sources are secondary or anecdotal.';
  }

  answer += ' What the evidence means: The findings should be interpreted as research context, not as treatment recommendation. Significant uncertainty remains around broader clinical use.';
  answer += ' Limitations: Study design, sample size, and the absence of definitive human evidence make it premature to draw a strong clinical conclusion.';

  return {
    answer,
    whyThisAnswer: `This answer was generated using ${sources.length} sources from the research library. Evidence was weighted by study type and strength.`,
    evidenceLevel: hasHumanEvidence ? 'Human/clinical evidence' : 'Limited/mixed evidence',
    citations: sources.slice(0, 3),
    confidence: hasHumanEvidence ? 'medium' : 'low',
    responseType: 'research',
    hasSufficientEvidence: true,
  };
}

function buildDomainBoundaryResponse() {
  return {
    answer: "I am specialized in peptide research and evidence-based literature review.\n\nI can help with:\n• Peptide studies and evidence\n• Research comparisons\n• Study limitations and methodology\n• Research protocols and findings\n• Related scientific literature\n\nFor topics outside peptide research, I recommend other resources. What peptide research question can I help with?",
    whyThisAnswer: 'The question is outside the domain of peptide research, which is the assistant specialization.',
    evidenceLevel: 'Domain boundary',
    citations: [],
    confidence: 'n/a',
    responseType: 'boundary',
    hasSufficientEvidence: false,
  };
}

function buildClarificationResponse() {
  return {
    answer: "I am not quite sure what you are asking. Could you clarify? I work best with questions like:\n\n• What does research say about [peptide]?\n• Compare [peptide A] and [peptide B]\n• What human studies are available?\n• What are the limitations of this evidence?\n• Show me the research on [topic]",
    whyThisAnswer: 'The intent of the message was unclear and needs clarification.',
    evidenceLevel: 'Clarification needed',
    citations: [],
    confidence: 'low',
    responseType: 'clarification',
    hasSufficientEvidence: false,
  };
}

// ============================================================================
// SOURCE SEARCH - Find relevant research from the knowledge base
// ============================================================================

export function getRelevantSources(question, topics = []) {
  const query = normalize(question);
  const topicTerms = topics.map(normalize).filter(Boolean);

  if (!query) {
    return [];
  }

  return researchSources.filter((source) => {
    const searchable = [
      source.title,
      source.peptide,
      source.abstract,
      source.journal,
      source.studyType,
      source.evidenceLevel,
      ...source.authors,
    ].join(' ').toLowerCase();

    const topicMatch = topicTerms.length === 0 || topicTerms.some((term) => searchable.includes(term));
    const questionMatch = searchable.includes(query) || 
                          query.split(/\s+/).some((term) => term.length > 3 && searchable.includes(term));

    return topicMatch && questionMatch;
  });
}
