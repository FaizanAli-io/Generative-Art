import cv2
import numpy as np
import json
from scipy.interpolate import splprep, splev

def image_to_outline(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Image not found at path: {image_path}")
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    return edges

def outline_to_contours(edges, num_contours):
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        raise ValueError("No contours found")
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:num_contours]
    return contours

def smooth_contour(contour, num_points=100):
    # Convert contour to a format suitable for splprep
    points = contour.reshape(-1, 2).T
    tck, _ = splprep(points, s=10, k=3)  # Cubic spline with no smoothing factor
    u = np.linspace(0, 1, num_points)
    smooth_points = splev(u, tck)
    return np.vstack(smooth_points).T

def save_contours_to_json(contours, filename):
    data = {}
    for i, contour in enumerate(contours):
        smoothed_contour = smooth_contour(contour)
        points = smoothed_contour.tolist()  # Convert to list of lists
        data[f"contour_{i}"] = points

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

def main(image_path, num_contours, output_file):
    edges = image_to_outline(image_path)
    contours = outline_to_contours(edges, num_contours)
    save_contours_to_json(contours, output_file)

if __name__ == "__main__":
    num_contours = 12
    image_path = r"sketches\sketch 3\name.png"
    output_file = r"sketches\sketch 3\contours.json"
    main(image_path, num_contours, output_file)
