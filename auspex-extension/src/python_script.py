def analyze_data(text):
    """
    Analyze the input text and return some statistics
    """
    # Basic text analysis
    word_count = len(text.split())
    char_count = len(text)
    lines = text.split('\n')
    line_count = len(lines)
    
    # Create a simple report
    report = f"""Text Analysis Results:
    - Number of words: {word_count}
    - Number of characters: {char_count}
    - Number of lines: {line_count}
    """
    
    return report

# Example usage (this will work in Pyodide)
if __name__ == "__main__":
    sample_text = "Hello World!\nThis is a test."
    result = analyze_data(sample_text)
    print(result) 