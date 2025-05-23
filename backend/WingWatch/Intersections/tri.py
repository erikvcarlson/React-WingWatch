from WingWatch.Intersections import montecarlo
#from WingWatch.Tools import line_intersection, tritrioverlap #deprecated 9/12/2024
from scipy.spatial import ConvexHull
from WingWatch.Tools import translation
import numpy as np
import scipy.spatial as ss
import WingWatch.Tools.point_check as pc
import trimesh
import pandas as pd

def generate_station_shells(list_of_detections:list):
    station_shells = []

    #We use the first antenna in the passed data as a way to measure the offset in the geometries to the other antennas   
    ref_lat =list_of_detections[0].station.lat
    ref_long = list_of_detections[0].station.long
    ref_alt = list_of_detections[0].station.alt

    for i in range(len(list_of_detections)):
        station_of_interest = list_of_detections[i].station
        offset = translation.XYZ_distance(ref_lat,ref_long,ref_alt,station_of_interest.lat,station_of_interest.long,station_of_interest.alt)
                
        #antenna number of the detection is larger than the total number of antennas assigned to the station, skip it
        if list_of_detections[i].antenna-1 > len(station_of_interest.antennas): 
            continue
        
        station_shells.append(station_of_interest.provide_boundary(list_of_detections[i].antenna-1,list_of_detections[i].rssi,offset[0],offset[1],offset[2]))
    

        # for j in range(len(detections_on_station)):
        #     single_detection = detections_on_station[j]
        #     antenna_number_of_detection = single_detection[0] - 1
        #     #antenna number of the detection is larger than the total number of antennas assigned to the station, skip it
        #     if antenna_number_of_detection > len(station_of_interest.antennas): 
        #         continue
        #     station_shells.append(station_data[i][1].provide_boundary(station_data[i][0][j][0]-1,station_data[i][0][j][1],offset[0],offset[1],offset[2]))
        # #except:
        # #    pass

    return station_shells


def intersect_of_two_triangles(edges_T1,edges_T2):
    #potnetially deprecated - EC - 8/1/2024
    ## A1, B1, C1 = points_for_tri_TUR[station_3_indices[sols[i][0]]]
    ## A2, B2, C2 = points_for_tri_BRR[station_1_indices[sols[i][1]]]

    # Edges of T1
    #edges_T1 = [(A1, B1), (B1, C1), (C1, A1)]

    # Edges of T2
    #edges_T2 = [(A2, B2), (B2, C2), (C2, A2)]


    # Find intersections between T1 and T2
    intersections = []
    for edge1 in edges_T1:
        for edge2 in edges_T2:
            intersection = line_intersection(edge1[0], edge1[1], edge2[0], edge2[1])
            if intersection is not None:
                intersections.append(intersection)

    return intersections

def generate_box_surface_points(x_min, x_max, y_min, y_max, z_min, z_max, step):
    """
    Generate points on the surface of a box. Used to prevent the bird from being in the ground

    Parameters:
        x_min, x_max: Range for x-axis.
        y_min, y_max: Range for y-axis.
        z_min, z_max: Range for z-axis.
        step: Spacing between points.

    Returns:
        List of tuples representing points on the box surface.
    """
    points = []

    # Generate ranges
    x_range = np.arange(x_min, x_max + step, step)
    y_range = np.arange(y_min, y_max + step, step)
    z_range = np.arange(z_min, z_max + step, step)

    # Bottom and top faces (z_min and z_max)
    for x in x_range:
        for y in y_range:
            points.append((x, y, z_min))
            points.append((x, y, z_max))

    # Side faces (x_min and x_max)
    for y in y_range:
        for z in z_range:
            points.append((x_min, y, z))
            points.append((x_max, y, z))

    # Front and back faces (y_min and y_max)
    for x in x_range:
        for z in z_range:
            points.append((x, y_min, z))
            points.append((x, y_max, z))

    return points

def overlap_of_three_radiation_patterns(list_of_detections):
    '''
    station_1_boundary: provided boundary from a command such as 
        = SEL_Station.provide_boundary(0,-98,offset_X=offset_SEL[0],offset_Y=offset_SEL[1],offset_Z=offset_SEL[2]) 
    
    '''

    print('Started Station Shell Generation')
    #we need to grab the boundary points for each of the shells at the defined RSSI
    station_shells = generate_station_shells(list_of_detections)
    print('Station Shells Generated')

    #Once we have done that we can breakup the station shells data into three seperate components
    print(f'The length of the shell 0 is: {len(station_shells[0])}')
    station_1_boundary = station_shells[0]
    print(f'The length of the shell 1 is: {len(station_shells[1])}')
    station_2_boundary = station_shells[1]
    print(f'The length of the shell 2 is: {len(station_shells[2])}')
    station_3_boundary = station_shells[2]


    # Parameters of the box
    x_min, x_max = -30000, 30000 #this needs to be sufficiently large as to not accidently effect the result of the translational accuracy. 
    y_min, y_max = -30000, 30000
    z_min, z_max = 0, 30000
    step = 5000  # Change this value for finer or coarser granularity


    #the bird cannot travel through the ground
    above_ground_boundary = generate_box_surface_points(x_min, x_max, y_min, y_max, z_min, z_max, step)


    mesh = trimesh.convex.convex_hull(station_1_boundary)
    print('Mesh 0 Generated')
    mesh_1 = trimesh.convex.convex_hull(station_2_boundary)
    print('Mesh 1 Generated')
    mesh_2 = trimesh.convex.convex_hull(station_3_boundary)
    print('Mesh 2 Generated')
    
    
    #mesh_above_ground = trimesh.convex.convex_hull(above_ground_boundary)
    #print('Ground rejection Mesh Generated')

    #mesh4 = trimesh.boolean.intersection([mesh,mesh_1,mesh_2,mesh_above_ground])

    mesh4 = trimesh.boolean.intersection([mesh,mesh_1,mesh_2])

    print("The intersection has been generated.")
    intersections = mesh4.vertices
    print(f'The number of verticies in the intersection is {len(intersections)}')
    hull_of_intersections = ss.ConvexHull(intersections)

    return intersections,hull_of_intersections




