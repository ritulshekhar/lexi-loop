const WORDS = [
    {
        word: "concise",
        pronunciation: "/kənˈsaɪs/",
        partOfSpeech: "adjective",
        meaning: "Giving a lot of information clearly in only a few words.",
        synonym: "brief",
        antonym: "verbose",
        examples: [
            "Please keep your presentation concise.",
            "She gave a concise summary of the project.",
            "The client asked for a concise update.",
            "Try to keep your email concise and professional."
        ]
    },
    {
        word: "feasible",
        pronunciation: "/ˈfiːzəbəl/",
        partOfSpeech: "adjective",
        meaning: "Possible and practical to achieve.",
        synonym: "practical",
        antonym: "impractical",
        examples: [
            "We need to determine whether the proposal is feasible.",
            "The team believes the timeline is feasible.",
            "Is it feasible to complete this by Friday?",
            "The client asked whether the solution was financially feasible."
        ]
    },
    {
        word: "clarify",
        pronunciation: "/ˈklærəfaɪ/",
        partOfSpeech: "verb",
        meaning: "To make something easier to understand by explaining it more clearly.",
        synonym: "explain",
        antonym: "confuse",
        examples: [
            "Could you clarify the last requirement?",
            "I want to clarify one point before we continue.",
            "She clarified the expectations during the meeting.",
            "Let me clarify what the client is asking for."
        ]
    },
    {
        word: "leverage",
        pronunciation: "/ˈlevərɪdʒ/",
        partOfSpeech: "verb",
        meaning: "To use something effectively to achieve a better result.",
        synonym: "utilize",
        antonym: "waste",
        examples: [
            "We can leverage our existing data to improve the model.",
            "The company wants to leverage automation.",
            "Let's leverage the team's previous experience.",
            "We should leverage existing tools instead of building everything from scratch."
        ]
    },
    {
        word: "articulate",
        pronunciation: "/ɑːrˈtɪkjələt/",
        partOfSpeech: "adjective",
        meaning: "Able to express ideas clearly and effectively.",
        synonym: "expressive",
        antonym: "inarticulate",
        examples: [
            "She is very articulate when explaining technical concepts.",
            "He gave an articulate response to the client's question.",
            "You need to be articulate during the presentation.",
            "Her articulate explanation helped the team understand the issue."
        ]
    },
    {
        word: "proactive",
        pronunciation: "/proʊˈæktɪv/",
        partOfSpeech: "adjective",
        meaning: "Taking action before a problem happens instead of waiting for it.",
        synonym: "preventive",
        antonym: "reactive",
        examples: [
            "We should take a proactive approach to security.",
            "She is proactive about communicating project risks.",
            "Being proactive can prevent unnecessary delays.",
            "The client appreciated our proactive response."
        ]
    },
    {
        word: "comprehensive",
        pronunciation: "/ˌkɑːmprɪˈhensɪv/",
        partOfSpeech: "adjective",
        meaning: "Including all or nearly all important details.",
        synonym: "complete",
        antonym: "limited",
        examples: [
            "We prepared a comprehensive report.",
            "The client requested a comprehensive analysis.",
            "This document provides a comprehensive overview of the project.",
            "Before making a decision, we need a comprehensive understanding of the problem."
        ]
    },
    {
        word: "tentative",
        pronunciation: "/ˈtentətɪv/",
        partOfSpeech: "adjective",
        meaning: "Not final or certain and may still change.",
        synonym: "provisional",
        antonym: "definite",
        examples: [
            "We have a tentative meeting scheduled for Monday.",
            "The timeline is still tentative.",
            "These dates are tentative until the client confirms them.",
            "She gave us a tentative plan for the next phase."
        ]
    },
    {
        word: "ambiguous",
        pronunciation: "/æmˈbɪɡjuəs/",
        partOfSpeech: "adjective",
        meaning: "Having more than one possible meaning and therefore being unclear.",
        synonym: "unclear",
        antonym: "explicit",
        examples: [
            "The requirement is too ambiguous to implement.",
            "His response was ambiguous.",
            "The contract contains an ambiguous statement.",
            "We should clarify the ambiguous parts of the specification."
        ]
    },
    {
        word: "substantial",
        pronunciation: "/səbˈstænʃəl/",
        partOfSpeech: "adjective",
        meaning: "Large, important, or significant in amount or effect.",
        synonym: "significant",
        antonym: "insignificant",
        examples: [
            "The update resulted in a substantial improvement.",
            "We made substantial progress this week.",
            "The project requires a substantial amount of effort.",
            "The client saw a substantial increase in performance."
        ]
    },
    {
        word: "facilitate",
        pronunciation: "/fəˈsɪləteɪt/",
        partOfSpeech: "verb",
        meaning: "To make something easier or help it happen.",
        synonym: "assist",
        antonym: "hinder",
        examples: [
            "This tool will facilitate communication between teams.",
            "The manager facilitated the discussion.",
            "Automation can facilitate faster decision-making.",
            "We created the dashboard to facilitate easier reporting."
        ]
    },
    {
        word: "streamline",
        pronunciation: "/ˈstriːmlaɪn/",
        partOfSpeech: "verb",
        meaning: "To make a process simpler, faster, and more efficient.",
        synonym: "simplify",
        antonym: "complicate",
        examples: [
            "We need to streamline the approval process.",
            "The new system will streamline our workflow.",
            "Automation helped streamline repetitive tasks.",
            "The team is looking for ways to streamline client onboarding."
        ]
    },
    {
        word: "reiterate",
        pronunciation: "/riˈɪtəreɪt/",
        partOfSpeech: "verb",
        meaning: "To say or explain something again, usually for emphasis or clarity.",
        synonym: "repeat",
        antonym: "omit",
        examples: [
            "I would like to reiterate the importance of this deadline.",
            "Let me reiterate what we agreed on.",
            "The manager reiterated the project requirements.",
            "She reiterated that the changes were necessary."
        ]
    },
    {
        word: "discrepancy",
        pronunciation: "/dɪˈskrepənsi/",
        partOfSpeech: "noun",
        meaning: "A difference between two things that should be the same.",
        synonym: "inconsistency",
        antonym: "agreement",
        examples: [
            "We noticed a discrepancy in the financial report.",
            "There is a discrepancy between the two datasets.",
            "Please investigate the discrepancy before submitting the report.",
            "The client pointed out a discrepancy in the invoice."
        ]
    },
    {
        word: "pragmatic",
        pronunciation: "/præɡˈmætɪk/",
        partOfSpeech: "adjective",
        meaning: "Focused on practical solutions rather than theory or ideals.",
        synonym: "practical",
        antonym: "idealistic",
        examples: [
            "We need a pragmatic solution to this problem.",
            "She took a pragmatic approach to the deadline.",
            "The team made a pragmatic decision based on the available data.",
            "A pragmatic strategy may be better for the client right now."
        ]
    },
    {
        word: "versatile",
        pronunciation: "/ˈvɜːrsətaɪl/",
        partOfSpeech: "adjective",
        meaning: "Able to be used or adapted for many different purposes.",
        synonym: "adaptable",
        antonym: "limited",
        examples: [
            "Python is a versatile programming language.",
            "She is a versatile team member.",
            "This tool is versatile enough to handle several workflows.",
            "The solution is flexible and versatile."
        ]
    },
    {
        word: "compelling",
        pronunciation: "/kəmˈpelɪŋ/",
        partOfSpeech: "adjective",
        meaning: "Very convincing, interesting, or persuasive.",
        synonym: "convincing",
        antonym: "unconvincing",
        examples: [
            "He presented a compelling argument.",
            "The report provides compelling evidence.",
            "We need a compelling reason to change the strategy.",
            "The proposal was compelling enough to win client approval."
        ]
    },
    {
        word: "consensus",
        pronunciation: "/kənˈsensəs/",
        partOfSpeech: "noun",
        meaning: "General agreement among a group of people.",
        synonym: "agreement",
        antonym: "disagreement",
        examples: [
            "The team reached a consensus.",
            "We need consensus before moving forward.",
            "There was broad consensus on the proposed changes.",
            "The meeting ended with consensus on the next steps."
        ]
    },
    {
        word: "initiative",
        pronunciation: "/ɪˈnɪʃətɪv/",
        partOfSpeech: "noun",
        meaning: "A new plan or action intended to solve a problem or achieve a goal.",
        synonym: "undertaking",
        antonym: "inaction",
        examples: [
            "The company launched a new training initiative.",
            "She took the initiative to improve the process.",
            "This initiative could reduce operational costs.",
            "The client is supporting the new digital initiative."
        ]
    },
    {
        word: "perspective",
        pronunciation: "/pərˈspektɪv/",
        partOfSpeech: "noun",
        meaning: "A particular way of thinking about or understanding something.",
        synonym: "viewpoint",
        antonym: "certainty",
        examples: [
            "From the client's perspective, speed is the priority.",
            "She offered a different perspective on the problem.",
            "We need to understand the customer's perspective.",
            "His perspective helped the team reconsider the strategy."
        ]
    },
    {
        word: "prioritize",
        pronunciation: "/praɪˈɔːrətaɪz/",
        partOfSpeech: "verb",
        meaning: "To decide which things are most important and should be handled first.",
        synonym: "rank",
        antonym: "neglect",
        examples: [
            "We need to prioritize the most urgent tasks.",
            "The team prioritized security improvements.",
            "Let's prioritize the client's critical requirements.",
            "Learning to prioritize is important in a fast-paced environment."
        ]
    },
    {
        word: "accommodate",
        pronunciation: "/əˈkɑːmədeɪt/",
        partOfSpeech: "verb",
        meaning: "To adjust or make changes so that someone or something can be included.",
        synonym: "adapt",
        antonym: "exclude",
        examples: [
            "We can accommodate the client's request.",
            "The schedule was adjusted to accommodate everyone's availability.",
            "The design should accommodate future changes.",
            "Can the system accommodate a larger number of users?"
        ]
    },
    {
        word: "anticipate",
        pronunciation: "/ænˈtɪsəpeɪt/",
        partOfSpeech: "verb",
        meaning: "To expect something and prepare for it in advance.",
        synonym: "expect",
        antonym: "doubt",
        examples: [
            "We anticipate some challenges during deployment.",
            "The team anticipated the client's concerns.",
            "We should anticipate possible delays.",
            "The company anticipates higher demand next quarter."
        ]
    },
    {
        word: "constraint",
        pronunciation: "/kənˈstreɪnt/",
        partOfSpeech: "noun",
        meaning: "A limit or restriction that affects what can be done.",
        synonym: "limitation",
        antonym: "freedom",
        examples: [
            "Budget is our biggest constraint.",
            "We need to work within the project's technical constraints.",
            "Time constraints may affect the implementation.",
            "The client has several constraints that we need to consider."
        ]
    },
    {
        word: "resolve",
        pronunciation: "/rɪˈzɑːlv/",
        partOfSpeech: "verb",
        meaning: "To solve a problem or deal with a difficult situation.",
        synonym: "solve",
        antonym: "complicate",
        examples: [
            "We need to resolve this issue before deployment.",
            "The support team resolved the client's problem.",
            "Let's work together to resolve the discrepancy.",
            "The team quickly resolved the technical issue."
        ]
    },
    {
        word: "align",
        pronunciation: "/əˈlaɪn/",
        partOfSpeech: "verb",
        meaning: "To make sure that people, goals, or actions agree with each other.",
        synonym: "coordinate",
        antonym: "conflict",
        examples: [
            "Let's align on the project's objectives.",
            "The strategy needs to align with the business goals.",
            "We should align our expectations before starting.",
            "The teams met to align on the next steps."
        ]
    },
    {
        word: "stakeholder",
        pronunciation: "/ˈsteɪkhoʊldər/",
        partOfSpeech: "noun",
        meaning: "A person or group affected by or interested in a project or decision.",
        synonym: "participant",
        antonym: "outsider",
        examples: [
            "We need approval from the key stakeholders.",
            "The team presented the results to the stakeholders.",
            "Each stakeholder has different priorities.",
            "We should keep stakeholders informed throughout the project."
        ]
    },
    {
        word: "actionable",
        pronunciation: "/ˈækʃənəbəl/",
        partOfSpeech: "adjective",
        meaning: "Clear and practical enough to be acted on.",
        synonym: "practical",
        antonym: "vague",
        examples: [
            "The report should provide actionable recommendations.",
            "We need actionable feedback from the client.",
            "The meeting produced several actionable ideas.",
            "Turn the analysis into actionable next steps."
        ]
    },
    {
        word: "proficient",
        pronunciation: "/prəˈfɪʃənt/",
        partOfSpeech: "adjective",
        meaning: "Skilled and competent at doing something.",
        synonym: "skilled",
        antonym: "inexperienced",
        examples: [
            "She is proficient in Python and SQL.",
            "The role requires someone proficient in data analysis.",
            "He became proficient at presenting technical information.",
            "You should become proficient with the tools used by the team."
        ]
    },
    {
        word: "meticulous",
        pronunciation: "/məˈtɪkjələs/",
        partOfSpeech: "adjective",
        meaning: "Very careful and precise about details.",
        synonym: "careful",
        antonym: "careless",
        examples: [
            "She is meticulous when reviewing reports.",
            "The project requires meticulous attention to detail.",
            "He was meticulous about documenting every change.",
            "Her meticulous work helped us identify the error."
        ]
    }
];