import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
  const prompts = [
    "Who is the best player in the NBA?",
    "What are the latest NBA trades in 2025?",
    "What are the current standings in the NBA?",
    "What is the recent news in the NBA?",
    "Who won the Finals most recently?",
    "Was Luka Doncic traded this season?",
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionRow;
