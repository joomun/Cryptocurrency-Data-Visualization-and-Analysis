import json
import os

def convert_to_single_line_json(input_file_path, output_folder):
    with open(input_file_path, 'r') as file:
        # Read and parse the JSON data
        data = json.load(file)

    # Convert the data back to a single-line JSON string
    single_line_json = json.dumps(data)

    # Create the output filename
    base_name = os.path.basename(input_file_path)
    new_name = base_name.replace('.json', '_formatted.json')
    output_file_path = os.path.join(output_folder, new_name)

    # Save the single-line JSON to the new file
    with open(output_file_path, 'w') as file:
        file.write(single_line_json)

    return output_file_path

# Define the folder where the JSON files are and where to save them
folder_path = './Machine_Learning/Synthetic_Data/'

# Define the full path for the input files
train_file_path = os.path.join(folder_path, 'Synthetic_Train.json')
test_file_path = os.path.join(folder_path, 'Synthetic_Test.json')

# Convert and save the files
formatted_train_file_path = convert_to_single_line_json(train_file_path, folder_path)
formatted_test_file_path = convert_to_single_line_json(test_file_path, folder_path)

print("Formatted Train JSON saved to:", formatted_train_file_path)
print("Formatted Test JSON saved to:", formatted_test_file_path)
